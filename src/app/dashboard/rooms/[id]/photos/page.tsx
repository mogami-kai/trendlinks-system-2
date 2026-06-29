"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Trash2, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { createSignedUrlMap, removeFile, uploadFile } from "@/lib/storage";
import { formatDate, getStatusLabel } from "@/lib/format";
import type { Job, Photo } from "@/lib/types";

type RoomPayload = {
  id: string;
  room_number: string;
  layout: string | null;
  area: number | null;
  properties?: {
    id: string;
    name: string;
    management_companies?: { id: string; name: string };
  } | null;
};

type PhotoWithUrl = Photo & { signedUrl?: string | null };

export default function RoomPhotosPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [room, setRoom] = useState<RoomPayload | null>(null);
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: roomData }, { data: photoData }, { data: jobData }] = await Promise.all([
      supabase
        .from("rooms")
        .select(
          "id, room_number, layout, area, properties(id, name, management_companies(id, name))",
        )
        .eq("id", roomId)
        .single(),
      supabase
        .from("photos")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("id, title, status, move_out_date, tenant_name")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false }),
    ]);

    const signedUrls = await createSignedUrlMap(
      "photos",
      ((photoData ?? []) as Photo[]).map((item) => item.file_path),
    );

    setRoom((roomData ?? null) as RoomPayload | null);
    setPhotos(
      ((photoData ?? []) as Photo[]).map((item) => ({
        ...item,
        signedUrl: signedUrls[item.file_path] ?? null,
      })),
    );
    setJobs((jobData ?? []) as Job[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [roomId]);

  const upload = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      alert("画像ファイルを選択してください");
      return;
    }

    setUploading(true);
    const supabase = createClient();

    for (const file of images) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `${roomId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await uploadFile("photos", path, file, file.type);
      if (uploadError) {
        alert(`アップロード失敗: ${uploadError.message}`);
        continue;
      }

      const { error } = await supabase.from("photos").insert([
        {
          room_id: roomId,
          file_path: path,
          file_name: file.name,
          taken_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert(`写真レコード作成失敗: ${error.message}`);
      }
    }

    setUploading(false);
    void load();
  };

  const updateCaption = async (photo: PhotoWithUrl) => {
    const caption = window.prompt("キャプション", photo.caption ?? "");
    if (caption === null) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("photos")
      .update({ caption })
      .eq("id", photo.id);

    if (error) {
      alert(`キャプションの保存に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  const deletePhoto = async (photo: PhotoWithUrl) => {
    if (!window.confirm("この写真を削除します。元に戻せません。")) {
      return;
    }

    const storageResult = await removeFile("photos", photo.file_path);
    if (storageResult.error) {
      alert(`写真ファイル削除失敗: ${storageResult.error.message}`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      alert(`写真の削除に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  if (!room) {
    return <p className="text-sm text-slate-500">号室が見つかりません。</p>;
  }

  const property = room.properties;
  const company = property?.management_companies;

  return (
    <div>
      <PageHeader
        title={`${property?.name ?? ""} ${room.room_number} の写真`}
        description="この号室に紐づく写真をアップロード・閲覧・削除できます。"
        action={
          <Link
            href="/dashboard/photos"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
          >
            <ArrowLeft size={14} />
            写真一覧
          </Link>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="写真をアップロード"
            description="ドラッグ&ドロップ相当として、ライブラリまたはカメラから画像を追加できます。"
          />
          <CardBody className="space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  void upload(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  void upload(event.target.files);
                }
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
                <Upload size={14} />
                {uploading ? "アップロード中..." : "ファイル選択"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={14} />
                カメラで撮影
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={`この号室の案件 (${jobs.length}件)`}
            description={`${company?.name ?? "管理会社なし"} / ${property?.name ?? "-"} / ${
              room.room_number
            }`}
          />
          <CardBody className="space-y-3">
            {jobs.length === 0 ? (
              <EmptyState
                title="この号室の案件はまだありません"
                description="案件を起票すると、ここから案件詳細にも移動できます。"
              />
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="block rounded-2xl border border-line bg-white px-4 py-3 hover:border-slate-400"
                >
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getStatusLabel(job.status)} / 退去 {formatDate(job.move_out_date)}
                  </p>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`写真 (${photos.length}枚)`} description="クリック前提のギャラリー一覧" />
          <CardBody>
            {photos.length === 0 ? (
              <EmptyState
                title="まだ写真がありません"
                description="上のボタンから写真をアップロードしてください。"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-2xl border border-line bg-white"
                  >
                    <div className="aspect-square bg-panel-strong">
                      {photo.signedUrl ? (
                        <img
                          src={photo.signedUrl}
                          alt={photo.caption ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="space-y-3 px-4 py-3">
                      <p className="min-h-[2.5rem] text-sm text-slate-600">
                        {photo.caption || "（キャプション無し）"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => void updateCaption(photo)}
                        >
                          キャプション
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="flex-1"
                          onClick={() => void deletePhoto(photo)}
                        >
                          <Trash2 size={14} />
                          削除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
