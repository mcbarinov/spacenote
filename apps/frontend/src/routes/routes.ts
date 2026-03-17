import { rootRoute, route, index, layout } from "@tanstack/virtual-file-routes"

export const routes = rootRoute("root.layout.tsx", [
  route("/login", "login.page.tsx"),
  layout("auth", "auth.layout.tsx", [
    index("index/page.tsx"),
    route("/s/$slug", [
      index("s/_slug_/index/page.tsx"),
      route("/new", "s/_slug_/new.page.tsx"),
      route("/attachments", [index("s/_slug_/attachments/index.page.tsx"), route("/new", "s/_slug_/attachments/new.page.tsx")]),
      route("/$noteNumber", [
        index("s/_slug_/_noteNumber_/index/page.tsx"),
        route("/edit", "s/_slug_/_noteNumber_/edit/page.tsx"),
        route("/attachments", [
          index("s/_slug_/_noteNumber_/attachments/index.page.tsx"),
          route("/new", "s/_slug_/_noteNumber_/attachments/new.page.tsx"),
        ]),
      ]),
    ]),
    layout("admin", "admin.layout.tsx", [
      route("/admin/users", "admin/users/index/page.tsx"),
      route("/admin/users/new", "admin/users/new.page.tsx"),
      route("/admin/spaces", [
        index("admin/spaces/index/page.tsx"),
        route("/new", "admin/spaces/new.page.tsx"),
        route("/import", "admin/spaces/import.page.tsx"),
        route("/$slug", [
          route("/members", "admin/spaces/_slug_/members.page.tsx"),
          route("/fields", [
            index("admin/spaces/_slug_/fields/index/page.tsx"),
            route("/new", "admin/spaces/_slug_/fields/new.page.tsx"),
            route("/$fieldName/edit", "admin/spaces/_slug_/fields/_fieldName_/edit.page.tsx"),
          ]),
          route("/filters", [
            index("admin/spaces/_slug_/filters/index/page.tsx"),
            route("/new", "admin/spaces/_slug_/filters/new.page.tsx"),
            route("/$filterName/edit", "admin/spaces/_slug_/filters/_filterName_/edit.page.tsx"),
          ]),
          route("/templates", "admin/spaces/_slug_/templates/page.tsx"),
          route("/export", "admin/spaces/_slug_/export.page.tsx"),
          route("/settings", "admin/spaces/_slug_/settings/page.tsx"),
        ]),
      ]),
      route("/admin/telegram/tasks", "admin/telegram/tasks/page.tsx"),
      route("/admin/telegram/mirrors", "admin/telegram/mirrors/page.tsx"),
      route("/admin/pending-attachments", "admin/pending-attachments/page.tsx"),
    ]),
  ]),
])
