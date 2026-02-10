import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

// Forum schema types (would be in drizzle/schema.ts)
interface ForumPost {
  id: number;
  farmId: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  tags: string;
  views: number;
  likes: number;
  isPinned: boolean;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ForumReply {
  id: number;
  postId: number;
  userId: number;
  content: string;
  likes: number;
  isHelpful: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for forum posts
const mockForumPosts: ForumPost[] = [
  {
    id: 1,
    farmId: 1,
    userId: 1,
    title: "Best practices for maize yield optimization in dry season",
    content: "I'm planning to grow maize in the dry season. What are the best practices to maximize yield with limited water?",
    category: "Crop Management",
    tags: JSON.stringify(["maize", "irrigation", "yield"]),
    views: 2341,
    likes: 156,
    isPinned: true,
    isAnswered: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    farmId: 2,
    userId: 2,
    title: "Dealing with armyworm infestation in maize",
    content: "My maize field is showing signs of armyworm damage. What's the best organic solution?",
    category: "Pest & Disease Management",
    tags: JSON.stringify(["armyworm", "organic", "pest-control"]),
    views: 1856,
    likes: 98,
    isPinned: false,
    isAnswered: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
];

export const forumRouter = router({
  /**
   * Get all forum posts with filtering and pagination
   */
  getPosts: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(10),
        offset: z.number().default(0),
        sortBy: z.enum(["recent", "popular", "views"]).default("recent"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // This would query from database when table is created
        // For now, return mock data
        let posts = [...mockForumPosts];

        // Filter by category
        if (input.category && input.category !== "all") {
          posts = posts.filter((p) => p.category === input.category);
        }

        // Filter by search
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          posts = posts.filter(
            (p) =>
              p.title.toLowerCase().includes(searchLower) ||
              p.content.toLowerCase().includes(searchLower) ||
              JSON.parse(p.tags).some((tag: string) => tag.toLowerCase().includes(searchLower))
          );
        }

        // Sort
        if (input.sortBy === "popular") {
          posts.sort((a, b) => b.likes - a.likes);
        } else if (input.sortBy === "views") {
          posts.sort((a, b) => b.views - a.views);
        } else {
          posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        // Paginate
        const total = posts.length;
        posts = posts.slice(input.offset, input.offset + input.limit);

        return {
          posts,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error("Error fetching forum posts:", error);
        throw error;
      }
    }),

  /**
   * Get a single forum post with replies
   */
  getPost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const post = mockForumPosts.find((p) => p.id === input.postId);

        if (!post) {
          throw new Error("Post not found");
        }

        // Increment views
        post.views += 1;

        return {
          post,
          replies: [], // Would fetch from database
        };
      } catch (error) {
        console.error("Error fetching forum post:", error);
        throw error;
      }
    }),

  /**
   * Create a new forum post
   */
  createPost: protectedProcedure
    .input(
      z.object({
        title: z.string().min(5).max(255),
        content: z.string().min(10),
        category: z.string(),
        tags: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // This would insert into database when table is created
        const newPost: ForumPost = {
          id: mockForumPosts.length + 1,
          farmId: 1, // Would come from ctx.user
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: JSON.stringify(input.tags),
          views: 0,
          likes: 0,
          isPinned: false,
          isAnswered: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockForumPosts.push(newPost);

        return {
          success: true,
          postId: newPost.id,
          message: "Post created successfully",
        };
      } catch (error) {
        console.error("Error creating forum post:", error);
        throw error;
      }
    }),

  /**
   * Update a forum post
   */
  updatePost: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const post = mockForumPosts.find((p) => p.id === input.postId);

        if (!post) {
          throw new Error("Post not found");
        }

        // Verify ownership
        if (post.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Update fields
        if (input.title) post.title = input.title;
        if (input.content) post.content = input.content;
        if (input.category) post.category = input.category;
        if (input.tags) post.tags = JSON.stringify(input.tags);
        post.updatedAt = new Date();

        return {
          success: true,
          message: "Post updated successfully",
        };
      } catch (error) {
        console.error("Error updating forum post:", error);
        throw error;
      }
    }),

  /**
   * Delete a forum post
   */
  deletePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const index = mockForumPosts.findIndex((p) => p.id === input.postId);

        if (index === -1) {
          throw new Error("Post not found");
        }

        const post = mockForumPosts[index];

        // Verify ownership
        if (post.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        mockForumPosts.splice(index, 1);

        return {
          success: true,
          message: "Post deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting forum post:", error);
        throw error;
      }
    }),

  /**
   * Like a forum post
   */
  likePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const post = mockForumPosts.find((p) => p.id === input.postId);

        if (!post) {
          throw new Error("Post not found");
        }

        post.likes += 1;

        return {
          success: true,
          likes: post.likes,
        };
      } catch (error) {
        console.error("Error liking forum post:", error);
        throw error;
      }
    }),

  /**
   * Pin/unpin a forum post (admin only)
   */
  togglePin: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can pin posts");
        }

        const post = mockForumPosts.find((p) => p.id === input.postId);

        if (!post) {
          throw new Error("Post not found");
        }

        post.isPinned = !post.isPinned;

        return {
          success: true,
          isPinned: post.isPinned,
        };
      } catch (error) {
        console.error("Error toggling pin:", error);
        throw error;
      }
    }),

  /**
   * Mark post as answered
   */
  markAsAnswered: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const post = mockForumPosts.find((p) => p.id === input.postId);

        if (!post) {
          throw new Error("Post not found");
        }

        // Verify ownership
        if (post.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        post.isAnswered = true;

        return {
          success: true,
          message: "Post marked as answered",
        };
      } catch (error) {
        console.error("Error marking post as answered:", error);
        throw error;
      }
    }),

  /**
   * Get forum statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const totalPosts = mockForumPosts.length;
      const totalViews = mockForumPosts.reduce((sum, p) => sum + p.views, 0);
      const totalLikes = mockForumPosts.reduce((sum, p) => sum + p.likes, 0);
      const answeredPosts = mockForumPosts.filter((p) => p.isAnswered).length;

      const categories = new Map<string, number>();
      mockForumPosts.forEach((p) => {
        categories.set(p.category, (categories.get(p.category) || 0) + 1);
      });

      return {
        totalPosts,
        totalViews,
        totalLikes,
        answeredPosts,
        answerRate: totalPosts > 0 ? (answeredPosts / totalPosts) * 100 : 0,
        categories: Array.from(categories.entries()).map(([name, count]) => ({
          name,
          count,
        })),
      };
    } catch (error) {
      console.error("Error fetching forum stats:", error);
      throw error;
    }
  }),
});
