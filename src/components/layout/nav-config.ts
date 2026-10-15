import {
  ClipboardCheck,
  CirclePlus,
  Forklift,
  Handshake,
  House,
  List,
  Network,
  Package,
  Pencil,
  Settings,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  icon?: LucideIcon; // omitted -> rendered as a dot
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavChild[];
}

export const dashboardItem = { label: "Dashboard", href: "/dashboard", icon: House };

export const navGroups: NavGroup[] = [
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "Product List", href: "/products", icon: List },
      { label: "Add Product", href: "/products/add", icon: CirclePlus },
      { label: "Edit Product", href: "/products/edit", icon: Pencil },
    ],
  },
  {
    label: "Production",
    icon: Settings,
    children: [
      { label: "Production Plans", href: "/production/plans" },
      { label: "Work Orders", href: "/production/work-orders" },
      { label: "Operation Execution", href: "/production/operations" },
    ],
  },
  {
    label: "Machines",
    icon: Wrench,
    children: [
      { label: "Machine List", href: "/machines" },
      { label: "Machine Details", href: "/machines/details" },
    ],
  },
  {
    label: "Quality",
    icon: ClipboardCheck,
    children: [
      { label: "Quality Issues", href: "/quality/issues" },
      { label: "Issue Details", href: "/quality/details" },
    ],
  },
  {
    label: "Maintenance",
    icon: Wrench,
    children: [{ label: "Maintenance Work Orders", href: "/maintenance/work-orders" }],
  },
  {
    label: "Inventory",
    icon: Forklift,
    children: [{ label: "Stock", href: "/inventory/stock" }],
  },
  {
    label: "Suppliers",
    icon: Handshake,
    children: [{ label: "Supplier List", href: "/suppliers" }],
  },
  {
    label: "Purchase",
    icon: ShoppingCart,
    children: [{ label: "Purchase Orders", href: "/purchase/orders" }],
  },
  {
    label: "BOM",
    icon: Network,
    children: [{ label: "Bill of Materials", href: "/bom" }],
  },
];

/** Looks a page up by URL (used by the placeholder route). */
export function findNavItem(href: string) {
  for (const group of navGroups) {
    const child = group.children.find((c) => c.href === href);
    if (child) return { label: child.label, group: group.label };
  }
  return null;
}
