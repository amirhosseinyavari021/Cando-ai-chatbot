FROM flowiseai/flowise:latest
WORKDIR /app
COPY . .
EXPOSE 8090
CMD ["flowise", "start"]
