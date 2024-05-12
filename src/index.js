const http = require("http");
const axios = require('axios')
const textToImage = require('text-to-image');

const host = "0.0.0.0";
const port = 5000;
let prompt;


function executePrompt(prompt, callback) {
    axios.post('https://api.together.xyz/v1/chat/completions', {
        "model": "cognitivecomputations/dolphin-2.5-mixtral-8x7b",
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.7,
        "top_k": 50,
        "repetition_penalty": 1,
        "stop": [
            "<|im_end|>",
            "<|im_start|>"
        ],
        "messages": [
            {
                "content": "You are a helpful AI agent answer the questions user is asking precisely",
                "role": "system"
            },
            {
                "content": `${prompt}`,
                "role": "user"
            }
        ]
    }, {
        headers: {
            Authorization: 'Bearer TOKEN'
        }
    }).then((response) => {
        return callback(response.data.choices[0].message.content);
    }, (error) => {
        console.log(error);
        return callback(error);
    });

    return "Executing before time!!!";
}

const requestListener = function (req, res) {
    let promptStatus = false;
    let image = false;
    if (req.url === "/" || req.url === "/favicon.ico") {
        prompt = "No Text set for the AI."
    } else {
        promptStatus = true;
        prompt = req.url.replaceAll("/", "").replaceAll("-", " ").replaceAll("%20", " ");
        if (prompt.slice(-4) === ".png") {
            image = true;
        }
    }

    if (promptStatus && image) {
        text = executePrompt(prompt, function (response) {
            textToImage.generate(response).then(function (dataUri) {
                const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                res.setHeader("Content-Type", "image/png");
                res.setHeader("Content-Length", buffer.length);
                res.writeHead(200);
                res.write(buffer);
                res.end();

            })
        });

    } else if (promptStatus) {
        text = executePrompt(prompt, function (response) {
            textToImage.generate(response).then(function (dataUri) {
                const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');

                const imageSrc = `data:image/png;base64,${base64Data}`;

                let html = `<html><head><meta name="description"  content="${response}"><meta property="og:image" content="${imageSrc}"></head><body><img src="${imageSrc}"></body></html>`;

                res.setHeader("Content-Type", "text/html");
                res.setHeader("Content-Length", html.length);
                res.writeHead(200);
                res.write(html);
                res.end();

            })
        });
    } else {
        text = prompt;
        let html = `<html><body><p>${prompt}</p></body></html>`;

        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Length", html.length);
        res.writeHead(200);
        res.write(html);
        res.end();
    }


};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
})