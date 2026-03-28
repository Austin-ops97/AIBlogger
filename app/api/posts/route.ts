import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost, isSlugTaken } from "@/lib/db";
import slugify from "slugify";

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, source_url } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await isSlugTaken(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await createPost({
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200).replace(/[#*`]/g, "") + "...",
      source_url: source_url || "",
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
