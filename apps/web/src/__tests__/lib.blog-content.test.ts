/**
 * Blog Content Tests
 */

import { describe, expect, it } from "vitest";
import { blogPosts, getBlogPostBySlug, type BlogPost } from "@/lib/blog-content";

// ─── Blog post structure tests ────────────────────────────────────────────────

describe("blogPosts array", () => {
  it("contains at least 5 posts", () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(5);
  });

  it("every post has a slug", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.slug).toBe("string");
      expect(post.slug.length).toBeGreaterThan(0);
    });
  });

  it("every post has a title", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.title).toBe("string");
      expect(post.title.length).toBeGreaterThan(0);
    });
  });

  it("every post has an excerpt (description)", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.excerpt).toBe("string");
      expect(post.excerpt.length).toBeGreaterThan(0);
    });
  });

  it("every post has a category", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.category).toBe("string");
      expect(post.category.length).toBeGreaterThan(0);
    });
  });

  it("every post has a publishedAt date", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.publishedAt).toBe("string");
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("every post has a readMinutes value greater than 0", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.readMinutes).toBe("number");
      expect(post.readMinutes).toBeGreaterThan(0);
    });
  });

  it("every post has an author", () => {
    blogPosts.forEach((post) => {
      expect(typeof post.author).toBe("string");
      expect(post.author.length).toBeGreaterThan(0);
    });
  });

  it("every post has a body array with at least one paragraph", () => {
    blogPosts.forEach((post) => {
      expect(Array.isArray(post.body)).toBe(true);
      expect(post.body.length).toBeGreaterThan(0);
    });
  });

  it("each body entry is a non-empty string", () => {
    blogPosts.forEach((post) => {
      post.body.forEach((paragraph) => {
        expect(typeof paragraph).toBe("string");
        expect(paragraph.length).toBeGreaterThan(0);
      });
    });
  });
});

// ─── Content quality tests ────────────────────────────────────────────────────

describe("blogPosts content quality", () => {
  it("each slug contains only valid URL characters", () => {
    blogPosts.forEach((post) => {
      // Slugs should be lowercase hyphenated, no spaces or special chars
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it("each slug is unique", () => {
    const slugs = blogPosts.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("each post title is unique", () => {
    const titles = blogPosts.map((p) => p.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it("total body content per post exceeds 200 characters", () => {
    blogPosts.forEach((post) => {
      const totalContent = post.body.join(" ");
      expect(totalContent.length).toBeGreaterThan(200);
    });
  });

  it("publishedAt dates are valid calendar dates", () => {
    blogPosts.forEach((post) => {
      const date = new Date(post.publishedAt);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  it("publishedAt dates are not in the future beyond 2030", () => {
    blogPosts.forEach((post) => {
      const date = new Date(post.publishedAt);
      expect(date.getFullYear()).toBeLessThanOrEqual(2030);
    });
  });

  it("readMinutes is a reasonable value (1-60)", () => {
    blogPosts.forEach((post) => {
      expect(post.readMinutes).toBeGreaterThanOrEqual(1);
      expect(post.readMinutes).toBeLessThanOrEqual(60);
    });
  });

  it("each excerpt is shorter than the body content", () => {
    blogPosts.forEach((post) => {
      const bodyLength = post.body.join(" ").length;
      expect(post.excerpt.length).toBeLessThan(bodyLength);
    });
  });
});

// ─── getBlogPostBySlug Tests ──────────────────────────────────────────────────

describe("getBlogPostBySlug function", () => {
  it("returns the correct post for a valid slug", () => {
    const firstPost = blogPosts[0];
    const found = getBlogPostBySlug(firstPost.slug);
    expect(found).toBeDefined();
    expect(found?.slug).toBe(firstPost.slug);
    expect(found?.title).toBe(firstPost.title);
  });

  it("returns undefined for a non-existent slug", () => {
    const found = getBlogPostBySlug("this-does-not-exist-xyz-123");
    expect(found).toBeUndefined();
  });

  it("returns the correct post for each slug in blogPosts", () => {
    blogPosts.forEach((post) => {
      const found = getBlogPostBySlug(post.slug);
      expect(found?.slug).toBe(post.slug);
    });
  });

  it("returns undefined for empty string slug", () => {
    const found = getBlogPostBySlug("");
    expect(found).toBeUndefined();
  });

  it("is case-sensitive (slug must match exactly)", () => {
    const firstPost = blogPosts[0];
    const upperSlug = firstPost.slug.toUpperCase();
    const found = getBlogPostBySlug(upperSlug);
    expect(found).toBeUndefined();
  });
});

// ─── Category distribution tests ─────────────────────────────────────────────

describe("blogPosts category distribution", () => {
  it("has posts in multiple categories", () => {
    const categories = new Set(blogPosts.map((p) => p.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  it("category values are non-empty strings", () => {
    const categories = new Set(blogPosts.map((p) => p.category));
    categories.forEach((cat) => {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    });
  });
});

// ─── TypeScript interface compliance tests ────────────────────────────────────

describe("BlogPost interface compliance", () => {
  it("all required fields are present on every post", () => {
    const requiredFields: (keyof BlogPost)[] = [
      "slug",
      "title",
      "excerpt",
      "category",
      "publishedAt",
      "readMinutes",
      "author",
      "body",
    ];

    blogPosts.forEach((post) => {
      requiredFields.forEach((field) => {
        expect(post).toHaveProperty(field);
        expect(post[field]).toBeDefined();
      });
    });
  });
});
