import { rootRoute, route, index, layout } from "@tanstack/virtual-file-routes"

export const routes = rootRoute("root.layout.tsx", [
  route("/login", "login.page.tsx"),
  layout("auth.layout.tsx", [
    index("index.page.tsx"),
    route("/users", [index("users/index/page.tsx"), route("/new", "users/new.page.tsx")]),
    route("/spaces", [
      index("spaces/index/page.tsx"),
      route("/new", "spaces/new.page.tsx"),
      route("/import", "spaces/import.page.tsx"),
      route("/$slug", [
        route("/members", "spaces/_slug_/members.page.tsx"),
        route("/export", "spaces/_slug_/export.page.tsx"),
        route("/settings", "spaces/_slug_/settings/page.tsx"),
        route("/fields", [
          index("spaces/_slug_/fields/index/page.tsx"),
          route("/new", "spaces/_slug_/fields/new.page.tsx"),
          route("/$fieldName/edit", "spaces/_slug_/fields/_fieldName_/edit.page.tsx"),
        ]),
        route("/filters", [
          index("spaces/_slug_/filters/index/page.tsx"),
          route("/new", "spaces/_slug_/filters/new.page.tsx"),
          route("/$filterName/edit", "spaces/_slug_/filters/_filterName_/edit.page.tsx"),
        ]),
        route("/templates", "spaces/_slug_/templates/page.tsx"),
      ]),
    ]),
    route("/telegram", [route("/tasks", "telegram/tasks/page.tsx"), route("/mirrors", "telegram/mirrors/page.tsx")]),
  ]),
])
