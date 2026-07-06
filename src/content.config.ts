import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// -----------------------------------------------------------------------------
// Shared sub-schemas (used by Project, Engagement)
// -----------------------------------------------------------------------------

const LinkSchema = z.object({
	type: z.enum(['source', 'live', 'demo', 'paired']),
	url: z.string().url(),
	label: z.string().optional(),
});

const PairedArtifactSchema = z.object({
	name: z.string().min(1),
	relationship: z.string().min(1),
	link: LinkSchema,
});

const MediaAssetSchema = z.object({
	src: z.string().min(1),
	alt: z.string().min(1),
	caption: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Projects
// Encodes the Project Aggregate from .planning/domain_models.md.
// Invariants enforced:
//   - Every Project has at least one Link.
//   - A Project with prominence = headline-gem MUST have a hero_image and
//     a gallery of at least one item (the "feature-ready" criteria).
//   - category and prominence are independent axes (no cross-validation).
// -----------------------------------------------------------------------------

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z
		.object({
			title: z.string().min(1),
			tagline: z.string().min(1).max(120),
			category: z.enum(['game-tool-mod', 'personal-scratchpad']),
			prominence: z.enum(['headline-gem', 'wip-highlight']),
			featured_order: z.number().int().default(999),
			date_added: z.coerce.date(),
			tags: z.array(z.string()).optional(),
			hero_image: z.string().optional(),
			links: z
				.array(LinkSchema)
				.min(1, 'Every Project must have at least one Link'),
			paired_artifacts: z.array(PairedArtifactSchema).optional(),
			gallery: z.array(MediaAssetSchema).optional(),
		})
		.superRefine((data, ctx) => {
			if (data.prominence === 'headline-gem') {
				if (!data.hero_image) {
					ctx.addIssue({
						code: 'custom',
						message: 'headline-gem projects require a hero_image',
						path: ['hero_image'],
					});
				}
				if (!data.gallery || data.gallery.length < 1) {
					ctx.addIssue({
						code: 'custom',
						message: 'headline-gem projects require at least one gallery item',
						path: ['gallery'],
					});
				}
			}
		}),
});

// -----------------------------------------------------------------------------
// Owner (singleton)
// Encodes the OwnerProfile Aggregate.
// Invariants enforced:
//   - Exactly one Owner file is expected. The build does not currently assert
//     singleton-ness, but the schema permits only one file by convention.
//   - positioning values are 0-10 on each axis, both set intentionally
//     (no default-zero hiding in production).
// -----------------------------------------------------------------------------

const owner = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/owner' }),
	schema: z.object({
		name: z.string().min(1),
		tagline: z.string().min(1),
		positioning: z.object({
			freelance_priority: z.number().int().min(0).max(10),
			career_priority: z.number().int().min(0).max(10),
		}),
		narrative_sections: z
			.array(
				z.object({
					heading: z.string().min(1),
					body_markdown: z.string().min(1),
				}),
			)
			.optional(),
	}),
});

// -----------------------------------------------------------------------------
// Engagement (singleton)
// Encodes the EngagementConfig Aggregate. The contact endpoint type maps to
// the locked v1 decision: 'email' (mailto: link).
//
// Cross-context invariant (verified at T503):
//   engagement.primary_cta.audience == owner.positioning.primary_audience
// (where primary_audience = 'freelance' if freelance_priority >= career_priority,
// else 'career'). The build-time check lives in a separate script; the schema
// below does not enforce it because the two collections are not loaded
// together at schema-definition time.
// -----------------------------------------------------------------------------

const engagement = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/engagement' }),
	schema: z.object({
		primary_cta: z.object({
			label: z.string().min(1),
			href: z.string().min(1),
			audience: z.enum(['freelance', 'career', 'both']),
		}),
		secondary_ctas: z
			.array(
				z.object({
					label: z.string().min(1),
					href: z.string().min(1),
					audience: z.enum(['freelance', 'career', 'both']).optional(),
				}),
			)
			.optional(),
		contact_endpoint: z.object({
			type: z.enum(['email', 'form', 'scheduling']),
			target: z.string().min(1),
		}),
	}),
});

export const collections = { projects, owner, engagement };
