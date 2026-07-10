pipeline {
  agent any

  tools {
    nodejs 'node-26'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    APP_NAME = "terraform-node-nginx"
    DEPLOY_USER = "deploy"
    DEPLOY_HOST = "35.154.215.250"
    DEPLOY_PATH = "/var/www/terraform-node-nginx"
    HEALTH_URL = "http://35.154.215.250/health"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh '''
          if npm run | grep -q "test"; then
            npm test
          else
            echo "No test script found, skipping"
          fi
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          if npm run | grep -q "build"; then
            npm run build
          else
            echo "No build script found, skipping"
          fi
        '''
      }
    }

    stage('Package') {
      steps {
        sh '''
          rm -rf artifact
          mkdir artifact

          cp package.json artifact/
          cp package-lock.json artifact/
          cp ecosystem.config.js artifact/

          if [ -f server.js ]; then cp server.js artifact/; fi
          if [ -d dist ]; then cp -r dist artifact/; fi
          if [ -d src ]; then cp -r src artifact/; fi
          if [ -d public ]; then cp -r public artifact/; fi

          tar -czf ${APP_NAME}-${BUILD_NUMBER}.tar.gz -C artifact .
        '''
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ['ec2-deploy-ssh-key']) {
          sh '''
            RELEASE_DIR="${DEPLOY_PATH}/releases/${BUILD_NUMBER}"

            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${DEPLOY_PATH}/releases"

            scp ${APP_NAME}-${BUILD_NUMBER}.tar.gz ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/releases/

            ssh ${DEPLOY_USER}@${DEPLOY_HOST} "
              set -e

              mkdir -p '${RELEASE_DIR}'
              tar -xzf '${DEPLOY_PATH}/releases/${APP_NAME}-${BUILD_NUMBER}.tar.gz' -C '${RELEASE_DIR}'

              cd '${RELEASE_DIR}'
              npm ci --omit=dev

              ln -sfn '${RELEASE_DIR}' '${DEPLOY_PATH}/current'

              cd '${DEPLOY_PATH}/current'

              if pm2 describe '${APP_NAME}' > /dev/null; then
                pm2 reload ecosystem.config.js --env production
              else
                pm2 start ecosystem.config.js --env production
              fi

              pm2 save
            "
          '''
        }
      }
    }

    stage('Health Check') {
      steps {
        sh '''
          sleep 5

          for i in 1 2 3 4 5; do
            if curl -fsS ${HEALTH_URL}; then
              echo "Health check passed"
              exit 0
            fi

            echo "Health check failed, retrying..."
            sleep 5
          done

          echo "Health check failed"
          exit 1
        '''
      }
    }
  }

  post {
    success {
      echo "Deployment successful"
    }

    failure {
      echo "Deployment failed"
    }
  }
}
