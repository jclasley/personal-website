FROM golang:alpine as go-build

WORKDIR /app

# get dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build the binary.
COPY ./cmd ./cmd
COPY ./internal ./internal
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-w -s" -o /bin/server ./cmd/server
########################
FROM node:alpine as node-build

# copy dependencies
COPY ./package*.json ./
RUN npm install


COPY ./components ./components
COPY ./pages ./pages
COPY ./lib ./lib
COPY ./styles ./styles
COPY ./posts ./posts
RUN ./node_modules/.bin/next build 
RUN ./node_modules/.bin/next export


########################
FROM busybox:latest

COPY --from=go-build /bin/server /bin/server
COPY --from=node-build ./out ./out

EXPOSE 8080
EXPOSE 443

CMD ["/bin/server"]