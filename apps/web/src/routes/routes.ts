import { rootRoute, route, index, layout } from "@tanstack/virtual-file-routes"

export const routes = rootRoute("root.layout.tsx", [
  route("/login", "login.page.tsx"),
  layout("auth.layout.tsx", [
    index("index/page.tsx"),
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
  ]),
])
