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
                            // Install sonar-scanner 6.1.0 (Java 17 compatible, no embedded JRE)
                            sh '''
                                if ! command -v sonar-scanner &> /dev/null; then
                                    echo "Installing sonar-scanner 6.1.0..."
                                    wget --timeout=30 --tries=3 -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.1.0.4477-linux.zip || {
                                        echo "Failed to download sonar-scanner. Attempting alternative download..."
                                        curl -L --connect-timeout 30 --max-time 300 -o sonar-scanner-cli-6.1.0.4477-linux.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.1.0.4477-linux.zip
                                    }
                                    unzip -qo sonar-scanner-cli-6.1.0.4477-linux.zip || { echo "Failed to extract sonar-scanner"; exit 1; }
                                    chmod +x sonar-scanner-6.1.0.4477-linux/bin/sonar-scanner
                                    echo "sonar-scanner installed successfully"
                                fi
                            '''
                            withSonarQubeEnv('SonarQube') {
                                sh '''
                                    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
                                    export PATH=/usr/lib/jvm/java-17-openjdk/bin:$PATH
                                    export PATH=$PWD/sonar-scanner-6.1.0.4477-linux/bin:$PATH
                                    java -version
                                    sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=300
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('CI - Docker Hub Push') {
            steps {
                script {
                    sh 'docker build -t "$DOCKER_IMAGE:$IMAGE_TAG" -t "$DOCKER_IMAGE:latest" .'
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
                        sh '''
                            echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                            docker push "$DOCKER_IMAGE:$IMAGE_TAG"
                            docker push "$DOCKER_IMAGE:latest"
                        '''
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
            sh 'docker logout || true'
        }
    }
}
