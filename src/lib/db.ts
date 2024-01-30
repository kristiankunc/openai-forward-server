import { PrismaClient, Prisma } from "@prisma/client";
import type { definition } from "@prisma/client";

export class Database {
	static prisma = new PrismaClient();
	static async getDefinitions(words: string[]) {
		// 4. 12. https://stackoverflow.com/questions/69857000/prisma-how-can-i-find-all-elements-that-match-an-id-list
		return await this.prisma.definition.findMany({
			where: {
				word: { in: words },
			},
		});
	}

	static async addDefinitions(words: Prisma.definitionCreateManyInput[]) {
		return await this.prisma.definition.createMany({
			data: words,
			skipDuplicates: true,
		});

		// this produces a bug where the definitions are not added to the database
	}
}
