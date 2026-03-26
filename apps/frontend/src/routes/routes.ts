import { rootRoute, route, index, layout } from "@tanstack/virtual-file-routes"

export const routes = rootRoute("root.layout.tsx", [
  route("/login", "login.page.tsx"),
  layout("auth", "auth.layout.tsx", [
    index("index.page.tsx"),
    route("/s/$slug", [
      index("s/_slug_/index/page.tsx"),
      route("/new", "s/_slug_/new.page.tsx"),
      route("/attachments", [index("s/_slug_/attachments/index.page.tsx"), route("/new", "s/_slug_/attachments/new.page.tsx")]),
      route("/$noteNumber", [
        index("s/_slug_/_noteNumber_/index/page.tsx"),
        route("/edit", "s/_slug_/_noteNumber_/edit.page.tsx"),
        route("/attachments", [
          index("s/_slug_/_noteNumber_/attachments/index.page.tsx"),
          route("/new", "s/_slug_/_noteNumber_/attachments/new.page.tsx"),
        ]),
      ]),
    ]),
    layout("spaces", "spaces/layout.tsx", [
      route("/spaces/new", "spaces/new.page.tsx"),
      route("/spaces/import", "spaces/import.page.tsx"),
      route("/spaces/$slug", [
        route("/members", "spaces/_slug_/members.page.tsx"),
        route("/fields", [
          index("spaces/_slug_/fields/index.page.tsx"),
          route("/new", "spaces/_slug_/fields/new.page.tsx"),
          route("/$fieldName/edit", "spaces/_slug_/fields/_fieldName_/edit.page.tsx"),
        ]),
        route("/filters", [
          index("spaces/_slug_/filters/index.page.tsx"),
          route("/new", "spaces/_slug_/filters/new.page.tsx"),
          route("/$filterName/edit", "spaces/_slug_/filters/_filterName_/edit.page.tsx"),
        ]),
        route("/templates", "spaces/_slug_/templates/page.tsx"),
        route("/export", "spaces/_slug_/export.page.tsx"),
        route("/settings", "spaces/_slug_/settings/page.tsx"),
      ]),
    ]),
    layout("admin", "admin/layout.tsx", [
      route("/admin/temp-space-access", "admin/temp-space-access.page.tsx"),
      route("/admin/users", "admin/users/index.page.tsx"),
      route("/admin/users/new", "admin/users/new.page.tsx"),
      route("/admin/telegram/tasks", "admin/telegram/tasks.page.tsx"),
      route("/admin/telegram/mirrors", "admin/telegram/mirrors.page.tsx"),
      route("/admin/pending-attachments", "admin/pending-attachments/page.tsx"),
    ]),
  ]),
])
