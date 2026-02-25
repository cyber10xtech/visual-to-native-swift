import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a friendly and helpful customer support assistant for Safesight, a Nigerian app that connects customers with trusted professionals and handymen for home and construction services.

Key information about Safesight:
- Professional categories: Architect, Project Manager, Builder, Interior Designer, Electrical Engineer, Structural Engineer, Mechanical Engineer, Quantity Surveyor
- Handyman categories: Wall Painter, Plumber, Carpenter, Electrician, AC Installer, Tiler, Welder, Bricklayer, Roof Installer, Furniture Repairs, Industrial Cleaner, Landscape Expert, Fumigator, General Labourer
- Users can browse professionals, view profiles, book services, and chat with professionals
- Bookings can be made through the app with preferred dates and times
- Users can save favorites and access emergency services (Plumber, Electrician, AC Installer, Welder)
- The app supports profile management, notifications, and real-time messaging
- Currency is Nigerian Naira (₦)
- Support email: enquiries@safesight.ng
- Website: safesight.ng

Be concise, helpful, and empathetic. If you don't know specific account details, guide the user to the relevant section of the app or suggest contacting enquiries@safesight.ng for further assistance. Keep responses under 3 sentences when possible. Always answer questions accurately based on app features.`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { sender: string; text: string }) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: chatMessages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Live chat error:", error);
    return new Response(
      JSON.stringify({ reply: "I'm having trouble connecting right now. Please try again in a moment." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
