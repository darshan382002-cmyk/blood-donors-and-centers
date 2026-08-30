import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { request_id, blood_group, emergency_level, location_name, seeker_phone } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find matching available donors for this blood group
    let donorQuery = supabase
      .from("donors")
      .select("user_id, area, city")
      .eq("blood_group", blood_group)
      .eq("availability_status", true);

    const { data: donors } = await donorQuery;

    // Get phone numbers of matching donors from profiles
    const donorUserIds = (donors || []).map((d: any) => d.user_id);
    let donorPhones: string[] = [];
    if (donorUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", donorUserIds);
      donorPhones = (profiles || [])
        .map((p: any) => p.phone)
        .filter((ph: string | null): ph is string => ph !== null && ph !== undefined);
    }

    // Build SMS message
    const levelLabel = emergency_level === "emergency" ? "EMERGENCY" : emergency_level === "urgent" ? "URGENT" : "Normal";
    const message = `LifeFlow: ${levelLabel} blood request for ${blood_group}${location_name ? ` near ${location_name}` : ""}. A patient needs your help. Please check the app to respond.`;

    // Log SMS notifications to the notifications table for each matching donor
    if (donorUserIds.length > 0) {
      const notifs = donorUserIds.map((uid: string) => ({
        user_id: uid,
        message: message,
        notification_type: emergency_level === "emergency" ? "emergency" : "request",
      }));
      await supabase.from("notifications").insert(notifs);
    }

    // Also notify the seeker that their request was successful
    if (seeker_phone) {
      const seekerMessage = `LifeFlow: Your ${levelLabel.toLowerCase()} blood request for ${blood_group} has been submitted successfully. We have notified ${donorPhones.length} matching donor(s) near ${location_name || "your area"}. You will receive updates when donors respond.`;
      // In a production setup, this would call an SMS gateway API here
      // For now, we log it as a notification
      const { data: seekerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", seeker_phone)
        .maybeSingle();
      if (seekerProfile) {
        await supabase.from("notifications").insert({
          user_id: seekerProfile.id,
          message: seekerMessage,
          notification_type: "system",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        donors_notified: donorUserIds.length,
        message: "Request submitted successfully. Matching donors have been notified.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
