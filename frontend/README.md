# DoaPerto — front-end (Angular 21 LTS)

```bash
npm ci
npm start                      # http://localhost:4200
npx ng test --watch=false      # testes (Vitest)
npx ng build                   # saída em dist/frontend/browser
```

As URLs da API e dos relatórios ficam em `public/config.json` e são lidas em tempo de execução,
então o mesmo build serve em qualquer ambiente. Veja o README da raiz para o deploy no S3.
