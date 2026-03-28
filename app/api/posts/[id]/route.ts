import { NextRequest, NextResponse } from "next/server";
import {
  getPostById,
  updatePost,
  deletePost,
  getDatabaseConfigurationIssue,
} from "@/lib/db";

function misconfiguredResponse() {
  const issue = getDatabaseConfigurationIssue();
  if (!issue) return null;
  return NextResponse.json({ error: issue }, { status: 503 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bad = misconfiguredResponse();
    if (bad) return bad;
    const post = await getPostById(parseInt(params.id));
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bad = misconfiguredResponse();
    if (bad) return bad;
    const body = await request.json();
    const post = await updatePost(parseInt(params.id), body);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bad = misconfiguredResponse();
    if (bad) return bad;
    const post = await getPostById(parseInt(params.id));
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await deletePost(parseInt(params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
