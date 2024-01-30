import OpenAI from "openai";
import { MessageContentText } from "openai/resources/beta/threads/messages/messages";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { Thread } from "openai/resources/beta/threads/threads";
import { Database } from "./db";
import { definition } from "@prisma/client";

// 3. 12. https://platform.openai.com/docs/api-reference/assistants/createAssistant
export class OpenAIManager {
	private openai: OpenAI;
	private apiKey: string;
	private assistantId: string;

	constructor(apiKey: string, assistantId: string) {
		this.apiKey = apiKey;
		this.openai = new OpenAI({
			apiKey: apiKey,
		});
		this.assistantId = assistantId;
	}

	// 3. 12. https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
	private sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async createThread() {
		return await this.openai.beta.threads.create();
	}

	private async addMessage(thread: Thread, content: string) {
		await this.openai.beta.threads.messages.create(thread.id, {
			role: "user",
			content: content,
		});
	}

	private async readResponse(thread: Thread) {
		return ((await this.openai.beta.threads.messages.list(thread.id)).data[0].content[0] as MessageContentText).text.value;
	}

	private async runAssistant(thread: Thread) {
		return await this.openai.beta.threads.runs.create(thread.id, {
			assistant_id: this.assistantId,
		});
	}

	private async isRunCompleted(thread: Thread, run: Run) {
		return (await this.openai.beta.threads.runs.retrieve(thread.id, run.id)).status === "completed";
	}

	public async getDefinitions(words: string[]): Promise<definition[]> {
		const alreadyDefinedWords = await Database.getDefinitions(words);
		for (let definedWord of alreadyDefinedWords) {
			const definedWordStr = definedWord.word;

			if (words.includes(definedWordStr)) {
				const index = words.indexOf(definedWordStr);
				words.splice(index, 1);
			}
		}

		if (words.length === 0) return alreadyDefinedWords;

		const thread = await this.createThread();
		await this.addMessage(thread, words.join(" "));

		const run = await this.runAssistant(thread);
		while (!(await this.isRunCompleted(thread, run))) {
			this.sleep(100);
		}

		const newDefintions = JSON.parse(await this.readResponse(thread)) as definition[];
		Database.addDefinitions(newDefintions);

		return Object.assign({}, alreadyDefinedWords, newDefintions);
	}
}
