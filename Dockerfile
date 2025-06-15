FROM public.ecr.aws/lambda/nodejs:18

WORKDIR ${LAMBDA_TASK_ROOT}

COPY package*.json ./

RUN npm install --production

RUN yum install -y atk cups-libs gtk3 libXcomposite alsa-lib \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt GConf2 nss

COPY . .

RUN yum install -y ipa-gothic-fonts

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN npx playwright install chromium

CMD [ "lambda.handler" ]