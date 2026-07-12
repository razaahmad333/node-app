pipeline {
  agent any

  parameters {
    choice(
      name: 'ROLLBACK_TEST_MODE',
      choices: ['none', 'local', 'global'],
      description: 'Use "local" to force the host-level rollback or "global" to force the ALB rollback after deployment.'
    )
  }

  tools {
    nodejs 'node-26'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    ALB_DNS_NAME = "terraform-node-nginx-alb-1026713903.ap-south-1.elb.amazonaws.com"

    AWS_REGION = "ap-south-1"
    ECR_REPO_URL = "148768123658.dkr.ecr.ap-south-1.amazonaws.com/terraform-node-nginx-repo"
    ASG_NAME = "terraform-node-nginx-asg"
    APP_PORT = "3000"
    DOCKER_PLATFORM = "linux/amd64"

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
          env.HEALTH_URL = "https://test.hikmahone.com/health"
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

    stage('Login to ECR') {
      steps {
        withCredentials([
          string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''
            aws ecr get-login-password --region ${AWS_REGION} \
              | docker login --username AWS --password-stdin ${ECR_REPO_URL}
          '''
        }
      }
    }

    stage('Docker Build And Push') {
      steps {
        sh '''
          docker build \
            --platform ${DOCKER_PLATFORM} \
            -t ${APP_NAME}:${BUILD_NUMBER} .

          docker tag ${APP_NAME}:${BUILD_NUMBER} ${ECR_REPO_URL}:${BUILD_NUMBER}
          docker tag ${APP_NAME}:${BUILD_NUMBER} ${ECR_REPO_URL}:latest

          docker push ${ECR_REPO_URL}:${BUILD_NUMBER}
          docker push ${ECR_REPO_URL}:latest
        '''
      }
    }

    stage('Refresh Auto Scaling Group') {
      steps {
        withCredentials([
          string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
          string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
        ]) {
          sh '''
            REFRESH_ID=$(aws autoscaling start-instance-refresh \
              --auto-scaling-group-name ${ASG_NAME} \
              --preferences MinHealthyPercentage=50,InstanceWarmup=180 \
              --query 'InstanceRefreshId' \
              --output text)

            echo "Started instance refresh: $REFRESH_ID"

            while true; do
              STATUS=$(aws autoscaling describe-instance-refreshes \
                --auto-scaling-group-name ${ASG_NAME} \
                --instance-refresh-ids $REFRESH_ID \
                --query 'InstanceRefreshes[0].Status' \
                --output text)

              echo "Instance refresh status: $STATUS"

              if [ "$STATUS" = "Successful" ]; then
                echo "Instance refresh successful"
                exit 0
              fi

              if [ "$STATUS" = "Failed" ] || [ "$STATUS" = "Cancelled" ]; then
                echo "Instance refresh failed"
                exit 1
              fi

              sleep 30
            done
          '''
        }
      }
    }

    stage('Health Check Through ALB') {
      steps {
        sh '''
          for i in 1 2 3 4 5 6; do
            if curl -fsS ${HEALTH_URL}; then
              echo "Health check passed"
              exit 0
            fi

            echo "Health check failed, retrying..."
            sleep 10
          done

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
