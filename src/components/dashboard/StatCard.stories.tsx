import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  Package,
} from "lucide-react";

const meta: Meta<typeof StatCard> = {
  title: "Dashboard/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
    value: {
      control: "number",
    },
    alert: {
      control: "boolean",
    },
    viewLabel: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    title: "Total Sales",
    value: 1234,
    icon: ShoppingCart,
    gradient: "from-blue-500 to-blue-600",
    href: "#",
    viewLabel: "View Details",
  },
};

export const WithAlert: Story = {
  args: {
    title: "Pending Orders",
    value: 12,
    icon: AlertCircle,
    gradient: "from-yellow-500 to-orange-600",
    href: "#",
    alert: true,
    viewLabel: "View Orders",
  },
};

export const Examples: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Revenue"
        value={45231}
        icon={DollarSign}
        gradient="from-green-500 to-emerald-600"
        href="#"
        viewLabel="View Details"
      />
      <StatCard
        title="Active Users"
        value={2350}
        icon={Users}
        gradient="from-blue-500 to-blue-600"
        href="#"
        viewLabel="View Users"
      />
      <StatCard
        title="Growth Rate"
        value={15}
        icon={TrendingUp}
        gradient="from-purple-500 to-pink-600"
        href="#"
        viewLabel="View Analytics"
      />
      <StatCard
        title="Products"
        value={892}
        icon={Package}
        gradient="from-cyan-500 to-blue-600"
        href="#"
        viewLabel="View Products"
      />
      <StatCard
        title="Pending Actions"
        value={7}
        icon={AlertCircle}
        gradient="from-yellow-500 to-orange-600"
        href="#"
        alert={true}
        viewLabel="View Actions"
      />
      <StatCard
        title="New Orders"
        value={124}
        icon={ShoppingCart}
        gradient="from-red-500 to-pink-600"
        href="#"
        viewLabel="View Orders"
      />
    </div>
  ),
};

export const LargeValue: Story = {
  args: {
    title: "Total Customers",
    value: 123456,
    icon: Users,
    gradient: "from-indigo-500 to-purple-600",
    href: "#",
    viewLabel: "View All",
  },
};
