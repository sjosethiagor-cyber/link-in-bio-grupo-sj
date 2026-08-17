import React from "react"

export type Marketplace = "mercado-livre" | "shopee"

export type Product = {
  id: string | number
  name: string
  sku: string
  category: string
  status: string
  driveUrl: string | null
  coverKey: string | null
  coverUrl: string | null
  coverColor: string
  mlTitles: string[]
  mlDescription: string
  shopeeTitles: string[]
  shopeeDescription: string
  updatedAt: string
}

export type EditorForm = {
  id?: string | number
  name: string
  sku: string
  category: string
  status: string
  driveUrl: string
  marketplace: Marketplace
  mlTitles: string[]
  mlDescription: string
  mlBulkText: string
  shopeeTitles: string[]
  shopeeDescription: string
  shopeeBulkText: string
  coverKey: string | null
  coverUrl: string | null
  coverColor: string
}

export type Validation = {
  status: "ok" | "warning" | "error"
  label: string
}

export type AdminSession = {
  signedIn: boolean
  isAuthorized: boolean
  role: "owner" | "admin" | "editor" | "viewer" | string
  canEdit: boolean
  canDelete: boolean
  canManageUsers: boolean
  user: { email: string; name: string } | null
  signInUrl: string
  signOutUrl: string
}

export type UserRoleRecord = {
  id: number | null | string
  email: string
  role: "owner" | "admin" | "editor" | "viewer"
  createdAt: string
  updatedAt: string
}

export function SearchIcon() {
  return React.createElement(
    "svg",
    {
      className: "icon-svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { width: "1.1em", height: "1.1em", marginRight: "4px" },
    },
    React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
    React.createElement("line", {
      x1: "21",
      y1: "21",
      x2: "16.65",
      y2: "16.65",
    }),
  )
}

export function PlusIcon() {
  return React.createElement(
    "svg",
    {
      className: "icon-svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: { width: "1.1em", height: "1.1em", marginRight: "4px" },
    },
    React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
  )
}
