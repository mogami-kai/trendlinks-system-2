import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { haversineMeters, isArrived } from "@/lib/haversine";
import { hasFeature } from "@/lib/plans";
import { arrivalSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!hasFeature(session.plan, "gpsArrival")) {
      return NextResponse.json(
        { error: { code: "plan", message: "GPS到着確認は Pro プランの機能です" } },
        { status: 403 }
      );
    }

    const body = arrivalSchema.parse(await request.json());
    const supabase = createClient();

    const { data: wo } = await supabase
      .from("work_orders")
      .select("id, sites(lat, lng)")
      .eq("id", body.work_order_id)
      .maybeSingle();
    if (!wo) {
      return NextResponse.json(
        { error: { code: "not_found", message: "作業指示が見つかりません" } },
        { status: 404 }
      );
    }

    const site = (wo as any).sites;
    let distance: number | null = null;
    let arrived = false;
    if (site?.lat != null && site?.lng != null) {
      distance = haversineMeters(body.lat, body.lng, site.lat, site.lng);
      arrived = isArrived(distance);
    }

    const { error } = await supabase.from("arrivals").insert({
      tenant_id: session.tenantId,
      work_order_id: body.work_order_id,
      staff_id: session.userId,
      lat: body.lat,
      lng: body.lng,
      distance_m: distance,
      is_arrived: arrived,
      method: "auto",
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      is_arrived: arrived,
      distance_m: distance ?? -1,
      arrived_at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 400 }
    );
  }
}
