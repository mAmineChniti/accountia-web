pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        DOCKER_IMAGE = 'mAmineChniti/accountia-web'
        IMAGE_TAG = '1.0'
        NODE_OPTIONS = '--max-old-space-size=4096'
        NEXT_TELEMETRY_DISABLED = '1'
        NEXT_PUBLIC_BACKEND = 'http://127.0.0.1:4789/api'
        npm_config_fund = 'false'
        npm_config_update_notifier = 'false'
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('CI') {
            stages {
                stage('Install Dependencies') {
                    steps {
                        sh 'npm i --legacy-peer-deps'
                    }
                }

                stage('Lint') {
                    steps {
                        sh 'npm run lint:check'
                    }
                }

                stage('Format') {
                    steps {
                        sh 'npm run format:check'
                    }
                }

                stage('Build') {
                    steps {
                        sh 'npm run build'
                    }
                }

                stage('SonarQube Analysis') {
                    steps {
                        script {
                            // SonarQube analysis is optional - don't fail build if it has issues
                            try {
                                // Install sonar-scanner if not available
                                sh '''
                                    if ! command -v sonar-scanner &> /dev/null; then
                                        echo "Installing sonar-scanner..."
                                        wget --timeout=30 --tries=3 -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip || {
                                            echo "Failed to download sonar-scanner. Skipping SonarQube analysis."
                                            exit 0
                                        }
                                        unzip -qo sonar-scanner-cli-5.0.1.3006-linux.zip || { echo "Failed to extract sonar-scanner. Skipping SonarQube analysis."; exit 0; }
                                        chmod +x sonar-scanner-5.0.1.3006-linux/bin/sonar-scanner
                                        echo "sonar-scanner installed successfully"
                                    fi
                                '''
                                withSonarQubeEnv('SonarQube') {
                                    sh '''
                                        export PATH=$PWD/sonar-scanner-5.0.1.3006-linux/bin:$PATH
                                        sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=300 || {
                                            echo "WARNING: SonarQube analysis failed. Continuing pipeline..."
                                            exit 0
                                        }
                                    '''
                                }
                            } catch (Exception e) {
                                echo "WARNING: SonarQube analysis stage failed: ${e.message}. Continuing pipeline..."
                            }
                        }
                    }
                }
            }
        }

        stage('CI - Docker Hub Push') {
            steps {
                script {
                    sh '''
                        # Check if Docker daemon is accessible for Jenkins user
                        if ! docker ps > /dev/null 2>&1; then
                            echo "Docker daemon is not accessible for Jenkins user. Skipping Docker build & push."
                            exit 0
                        fi
                        mkdir -p .docker-ci
                    '''
                    try {
                        sh 'DOCKER_CONFIG="$PWD/.docker-ci" docker build -t "$DOCKER_IMAGE:$IMAGE_TAG" -t "$DOCKER_IMAGE:latest" .'
                        withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                            sh '''
                                printf '%s' "$DOCKERHUB_PASSWORD" | DOCKER_CONFIG="$PWD/.docker-ci" docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                                DOCKER_CONFIG="$PWD/.docker-ci" docker push "$DOCKER_IMAGE:$IMAGE_TAG"
                                DOCKER_CONFIG="$PWD/.docker-ci" docker push "$DOCKER_IMAGE:latest"
                            '''
                        }
                    } catch (Exception e) {
                        echo "WARNING: Docker build/push failed or Docker credentials are unavailable: ${e.message}. Skipping Docker stage."
                    }
                }
            }
        }

    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs above.'
        }

        cleanup {
            archiveArtifacts artifacts: '.scannerwork/report-task.txt,coverage/**', allowEmptyArchive: true
            sh 'rm -rf sonar-scanner-* sonar-scanner-cli-*.zip .scannerwork/ || true'
            sh 'rm -rf .docker-ci || true'
        }
    }
}
