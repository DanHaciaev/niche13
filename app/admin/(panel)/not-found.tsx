import { ButtonLink, EmptyState } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className="pt-10">
      <EmptyState
        title="Страница не найдена"
        text="Такого раздела нет или запись была удалена."
        action={<ButtonLink href="/admin">На обзор</ButtonLink>}
      />
    </div>
  );
}
