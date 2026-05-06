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
                            // Install sonar-scanner if not available
                            sh '''
                                if ! command -v sonar-scanner &> /dev/null; then
                                    echo "Installing sonar-scanner..."
                                    wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.8.0.2856-linux.zip
                                    unzip -q sonar-scanner-cli-4.8.0.2856-linux.zip
                                    export PATH=$PWD/sonar-scanner-4.8.0.2856-linux/bin:$PATH
                                fi
                            '''
                            withSonarQubeEnv('SonarQube') {
                                sh '''
                                    export PATH=$PWD/sonar-scanner-4.8.0.2856-linux/bin:$PATH
                                    sonar-scanner -Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=300
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
            sh 'docker logout || true'
        }
    }
}
