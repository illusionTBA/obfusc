import express from "express";
import http from "node:http";
import createBareServer from "@tomphttp/bare-server-node";
import path from "node:path";
import * as dotenv from "dotenv";
import ejs from "ejs";
import request from "request";
dotenv.config();

const __dirname = process.cwd();
const server = http.createServer();
const app = express(server);
const bareServer = createBareServer("/bare/");
const APP_PORT = 7792;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs')

app.get("/", (req, res) => {
  res.render("home")
});
app.get("/instance", (req, res) => {
  res.render("index")
});



server.on("request", (req, res) => {
    if (bareServer.shouldRoute(req)) {
      bareServer.routeRequest(req, res);
    } else {
      app(req, res);
    }
  });
  
  server.on("upgrade", (req, socket, head) => {
    if (bareServer.shouldRoute(req)) {
      bareServer.routeUpgrade(req, socket, head);
    } else {
      socket.end();
    }
  });
  
  function createSystemPrompt() {
    let systemPrompt = `You are ObfuscAI, an AI assistant on Obfusc. Your primary function is to provide information and complete tasks as instructed. Aim for comprehensive, informative, and objective responses. Prioritize clarity and avoid unnecessary complexity. Understand and respond to the user's intent, adapting your response accordingly. Use examples or analogies to illustrate complex points. If uncertain about a query, ask clarifying questions or suggest potential approaches. Strive to be helpful, informative, and engaging. Remember, your goal is to assist the user effectively.`;
    return systemPrompt;
}

app.get('/api/ai', async (req, res) => {
    const userInput = req.query.userInput || '';
    let chatHistory = req.query.chatHistory ? decodeURIComponent(req.query.chatHistory).split('<br>') : [];
    chatHistory.push(`USER: ${userInput}\n`);

    const systemPrompt = createSystemPrompt();

    const historyMessages = chatHistory.map(line => {
        const role = line.startsWith('USER:') ? 'user' : 'assistant';
        const content = line.replace(/^(USER:|ASSISTANT:)\s*/, '');
        return { role, content };
    });

    const payload = {
        messages: [
            { role: "system", content: `${systemPrompt}` },
            ...historyMessages,
            { role: "user", content: `${userInput}` }
        ],
        max_tokens: 800,
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
        stream: "True"
    };

    const options = {
        url: 'https://api.deepinfra.com/v1/openai/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Origin': 'https://deepinfra.com',
            'Referer': 'https://deepinfra.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 OPR/107.0.0.0',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        },
        body: JSON.stringify(payload)
    };

    request.post(options).pipe(res);
});

  server.on("listening", () => {
    console.log(`obfusc is running on PORT -> ${APP_PORT}`);
  });
  
  server.listen({
    port: APP_PORT,
  });
