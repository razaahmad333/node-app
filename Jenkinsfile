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
    DEPLOY_USER = "deploy"
    DEPLOY_HOSTS = "43.205.217.168 15.207.98.122"
    ALB_DNS_NAME = "terraform-node-nginx-alb-1026713903.ap-south-1.elb.amazonaws.com"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Resolve Config') {
      steps {
        script {
          def packageJson = readJSON file: 'package.json'
          env.APP_NAME = packageJson.name
          env.DEPLOY_PATH = "/var/www/${env.APP_NAME}"
          env.HEALTH_URL = "http://${env.ALB_DNS_NAME}/health"
        }
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

    stage('Validate Syntax') {
      steps {
        sh '''
          node --check app.js
          node --check index.js
          node --check test/app.test.js
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

    stage('Smoke Test') {
      steps {
        sh '''
          node index.js &
          APP_PID=$!

          cleanup() {
            kill $APP_PID >/dev/null 2>&1 || true
          }

          trap cleanup EXIT

          sleep 3
          curl -fsS http://127.0.0.1:3000/health >/dev/null
          curl -fsS http://127.0.0.1:3000/ | grep -q "Congratulations"
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

          if [ -f app.js ]; then cp app.js artifact/; fi
          if [ -f index.js ]; then cp index.js artifact/; fi
          if [ -d dist ]; then cp -r dist artifact/; fi
          if [ -d src ]; then cp -r src artifact/; fi
          if [ -d public ]; then cp -r public artifact/; fi

          tar -czf ${APP_NAME}-${BUILD_NUMBER}.tar.gz -C artifact .
        '''
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([string(credentialsId: 'sample-secret', variable: 'SAMPLE_SECRET')]) {
          sshagent(credentials: ['ec2-deploy-ssh-key']) {
            sh '''
              RELEASE_DIR="${DEPLOY_PATH}/releases/${BUILD_NUMBER}"

              for DEPLOY_HOST in ${DEPLOY_HOSTS}; do
                ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "mkdir -p ${DEPLOY_PATH}/releases ${DEPLOY_PATH}/shared"

                scp ${APP_NAME}-${BUILD_NUMBER}.tar.gz ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/releases/

                ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                  set -e

                  mkdir -p '${RELEASE_DIR}'
                  tar -xzf '${DEPLOY_PATH}/releases/${APP_NAME}-${BUILD_NUMBER}.tar.gz' -C '${RELEASE_DIR}'

                  cd '${RELEASE_DIR}'
                  npm ci --omit=dev

                  cat > '${DEPLOY_PATH}/shared/.env.production' <<EOF
SAMPLE_SECRET=${SAMPLE_SECRET}
PORT=3000
EOF
                  chmod 600 '${DEPLOY_PATH}/shared/.env.production'

                  ln -sfn '${RELEASE_DIR}' '${DEPLOY_PATH}/current'

                  cd '${DEPLOY_PATH}/current'
                  set -a
                  . '${DEPLOY_PATH}/shared/.env.production'
                  set +a
                  pm2 delete '${APP_NAME}' || true
                  pm2 start ecosystem.config.js --env production
                  pm2 save
                "
              done
            '''
          }
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
