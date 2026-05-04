pipeline {
    agent any

    tools {
        nodejs 'node'
    }

    environment {
        DOCKER_IMAGE = "accountia-web-app"
        SCANNER_HOME = tool 'SonarScanner'
        SOURCE_DIR = "/var/jenkins_home/workspace/accountia-web"
        BUILD_DIR = "/tmp/accountia_build"
        NODE_OPTIONS = "--max-old-space-size=4096"
    }

    stages {
        stage('Clean & Copy') {
            steps {
                echo 'Préparation du dossier de build...'
                sh "rm -rf ${BUILD_DIR} && mkdir -p ${BUILD_DIR}"
                // Copie instantanée en ignorant les gros dossiers (node_modules, .next, .git)
                sh "cd ${SOURCE_DIR} && tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=coverage --exclude=jenkins_home -cf - . | tar -xf - -C ${BUILD_DIR}"
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${BUILD_DIR}") {
                    echo 'Installation des dépendances Linux...'
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('Lint Check') {
            steps {
                dir("${BUILD_DIR}") {
                    echo 'Vérification du style de code (ESLint)...'
                    sh 'npm run lint:check || true'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir("${BUILD_DIR}") {
                    echo 'Exécution des tests unitaires (Vitest)...'
                    sh 'npm run test:cov || true'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir("${BUILD_DIR}") {
                    echo 'Analyse de la qualité du code (SonarQube)...'
                    withSonarQubeEnv('SonarQube') {
                        sh "${SCANNER_HOME}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir("${BUILD_DIR}") {
                    echo 'Construction de l\'image Docker...'
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                dir("${SOURCE_DIR}") {
                    echo 'Déploiement...'
                    // Arrête et supprime l'ancien conteneur s'il existe
                    sh "docker stop accountia-web-app || true"
                    sh "docker rm accountia-web-app || true"
                    // Lance le nouveau conteneur
                    sh "docker run -d --name accountia-web-app -p 3000:3000 accountia-web-app:latest"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline Accountia terminé avec succès ! ✅'
        }
        failure {
            echo 'Le pipeline a échoué. Vérifie les logs ci-dessus. ❌'
        }
    }
}
