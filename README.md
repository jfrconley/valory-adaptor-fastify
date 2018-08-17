# valory-adaptor-fastify
**Provide fastify support for Valory**
## Usage
```bash
npm i valory-apaptor-fastify
```
Instantiate FastifyAdaptor and pass it to Valory
```typescript
import {FastifyAdaptor} from "valory-adaptor-fastify";
import {Valory} from "valory-runtime";

Valory.createInstance({
    info: {title: "some api"},
    server: new FastifyAdaptor(),
})
```