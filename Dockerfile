# AWS公式のNode.js 18のLambdaベースイメージを使用
FROM public.ecr.aws/lambda/nodejs:18

# 作業ディレクトリを作成
WORKDIR ${LAMBDA_TASK_ROOT}

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 本番環境で必要な依存関係のみをインストール
RUN npm install --production

# Playwrightが必要とするOSのライブラリをインストール
# (Amazon Linux 2ベースのイメージなのでyumを使います)
RUN yum install -y atk cups-libs gtk3 libXcomposite alsa-lib \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt GConf2 nss

# アプリケーションコード全体をコピー
COPY . .

# コンテナ内でPlaywrightにChromiumブラウザをインストールさせる
# --with-deps をつけることで依存関係も一緒にインストールします
RUN npx playwright install --with-deps chromium

# Lambdaが呼び出すハンドラーを指定 (lambda.jsのhandler関数を想定)
CMD [ "lambda.handler" ]