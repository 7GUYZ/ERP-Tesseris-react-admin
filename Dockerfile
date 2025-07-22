
# 1단계: 빌드 환경
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .

# 환경변수 전달 (빌드 시점에)
ARG REACT_APP_BASENAME
ENV REACT_APP_BASENAME=$REACT_APP_BASENAME

RUN npm run build

# 2단계: Nginx을 이용한 정적 파일 서빙
FROM nginx:alpine
# 빌드 결과물을 /reactadmin 하위에 복사
COPY --from=build /app/build /usr/share/nginx/html/reactadmin
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 

