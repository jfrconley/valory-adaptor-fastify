import {ApiResponse, ApiServer, HttpMethod, ValoryMetadata, ApiRequest} from "valory-runtime";
import {FastifyInstance, HTTPMethod } from "fastify";
import {IncomingMessage, ServerResponse, Server} from "http";
import fastify = require("fastify");
import {parse} from "querystring";
const pathReplacer = /{([\S]*?)}/g;

export class FastifyAdaptor implements ApiServer {
    public readonly locallyRunnable: boolean = true;
    public readonly allowDocSite: boolean = true;
    private instance: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({});
    constructor() {
        this.instance.addContentTypeParser("application/x-www-form-urlencoded", {parseAs: "string"}, formParser as any);
        this.instance.addContentTypeParser("application/json", {parseAs: "string"}, jsonParser as any);
    }
    public register(path: string, method: HttpMethod,
                    handler: (request: ApiRequest) => ApiResponse | Promise<ApiResponse>) {
        const route = `${path}:${HttpMethod[method]}`;
        path = path.replace(pathReplacer, ":$1");
        this.instance.route({
            method: HttpMethod[method] as HTTPMethod,
            url: path,
            handler: async (req, res) => {
                // FIXME: setting both formData and body is lazy, need a better solution
                const transRequest = new ApiRequest({
                    headers: req.req.headers as {[key: string]: any},
                    body: null,
                    rawBody: null,
                    formData: req.body,
                    query: req.query,
                    path: req.params,
                    route,
                });
                if (req.req.headers["content-type"] === "application/json" && req.body != null) {
                    transRequest.body = req.body.parsed;
                    transRequest.rawBody = req.body.raw;
                } else {
                    transRequest.body = req.body;
                }
                const response = await handler(transRequest);
                res.code(response.statusCode);
                (res as any).headers(response.headers);
                res.send(response.body);
            },
        });
    }

    public getExport(metadata: ValoryMetadata, options: any): {valory: ValoryMetadata} {
        this.instance.listen(options.port || process.env.PORT, options.host || process.env.HOST);
        return {valory: metadata};
    }

    public shutdown() {
        this.instance.server.close();
    }
}

function jsonParser(req: IncomingMessage, body: string, done: (err?: Error, body?: any) => void) {
    let json = null;
    try {
        json = JSON.parse(body);
    } catch (err) {
        err.statusCode = 400;
        return done(err, undefined);
    }
    done(null, {parsed: json, raw: body});
}

function formParser(req: IncomingMessage, body: string, done: (err?: Error, body?: any) => void) {
    done(null, parse(body));
}