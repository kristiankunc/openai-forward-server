import express from "express";
import { OpenAIManager } from "./lib/openai-manager";
import "dotenv/config"; // 3. 12. https://www.npmjs.com/package/dotenv

const app = express();
if (!process.env.OPENAI_TOKEN || !process.env.ASSISTANT_ID) {
	throw new Error("Missing config values");
}

const openaiManager = new OpenAIManager(process.env.OPENAI_TOKEN, process.env.ASSISTANT_ID);

app.get("/define/json", async function (req, res) {
	const words = req.query.words;

	// 3. 12. https://stackoverflow.com/questions/56210870/array-isarray-is-deprecated-now
	if (!words || !Array.isArray(words)) {
		res.sendStatus(400);
		return;
	}

	const definitions = await openaiManager.getDefinitions(words as string[]);

	res.json(definitions);
});

app.get("/define/test", async function (req, res) {
	const words = req.query.words;

	if (!words || !Array.isArray(words)) {
		res.sendStatus(400);
		return;
	}

	const definitions = (words as string[]).map((word) => {
		return { word: word, definition: `definice - ${word}` };
	});

	res.json(definitions);
});

app.listen(3000, () => {
	console.log(`Rrunning on port ${3000}.`);
});
