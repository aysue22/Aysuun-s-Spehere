import { defineCollection, z } from 'astro:content';
const blog = defineCollection({
	schema: ({ image }) => z.object({
		
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			heroImage: z.string(),
		}),
});

export const collections = { blog };