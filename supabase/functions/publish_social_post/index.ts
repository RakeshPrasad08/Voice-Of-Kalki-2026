import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PublishRequest {
  post_id: string;
  platform: string;
  content: string;
  access_token: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { post_id, platform, content, access_token }: PublishRequest =
      await req.json();

    if (!post_id || !platform || !content || !access_token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let externalPostId = "";
    let publishSuccess = false;

    if (platform === "twitter") {
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      const data = await response.json();
      externalPostId = data.data.id;
      publishSuccess = true;
    } else if (platform === "facebook") {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/feed?access_token=${access_token}`,
        {
          method: "POST",
          body: JSON.stringify({ message: content }),
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      externalPostId = data.id;
      publishSuccess = true;
    }

    if (publishSuccess) {
      const { error } = await supabase
        .from("social_media_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          external_post_id: externalPostId,
        })
        .eq("id", post_id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Post published successfully",
          external_post_id: externalPostId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error("Failed to publish post");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    await (async () => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const body = await req.json() as PublishRequest;
          await supabase
            .from("social_media_posts")
            .update({ status: "failed" })
            .eq("id", body.post_id);
        }
      } catch {
      }
    })();

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
