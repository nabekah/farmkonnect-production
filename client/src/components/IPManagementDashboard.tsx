import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, Download, Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/contexts/ToastContext";

export function IPManagementDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"whitelist" | "blacklist">("whitelist");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIP, setNewIP] = useState({ ipAddress: "", reason: "manual", description: "" });

  const statsQuery = trpc.securityManagement.getIPStatistics.useQuery();
  const whitelistQuery = trpc.securityManagement.getWhitelist.useQuery({ limit: 50 });
  const blacklistQuery = trpc.securityManagement.getBlacklist.useQuery({ limit: 50 });
  const searchQuery_ = trpc.securityManagement.searchIPs.useQuery(
    { query: searchQuery, limit: 50 },
    { enabled: searchQuery.length > 0 }
  );

  const addToWhitelistMutation = trpc.securityManagement.addToWhitelist.useMutation();
  const addToBlacklistMutation = trpc.securityManagement.addToBlacklist.useMutation();
  const removeIPMutation = trpc.securityManagement.removeIP.useMutation();
  const exportMutation = trpc.securityManagement.exportIPs.useMutation();

  const handleAddIP = async () => {
    if (!newIP.ipAddress) {
      showToast({ type: "error", title: "Error", message: "Please enter an IP address" });
      return;
    }

    try {
      if (activeTab === "whitelist") {
        await addToWhitelistMutation.mutateAsync({
          ipAddress: newIP.ipAddress,
          reason: newIP.reason as any,
          description: newIP.description || undefined,
        });
      } else {
        await addToBlacklistMutation.mutateAsync({
          ipAddress: newIP.ipAddress,
          reason: newIP.reason as any,
          description: newIP.description || undefined,
        });
      }

      showToast({
        type: "success",
        title: "Success",
        message: `IP added to ${activeTab}`,
      });

      setNewIP({ ipAddress: "", reason: "manual", description: "" });
      setShowAddForm(false);
      whitelistQuery.refetch();
      blacklistQuery.refetch();
      statsQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to add IP",
      });
    }
  };

  const handleRemoveIP = async (ipAddress: string) => {
    if (!window.confirm(`Remove ${ipAddress} from ${activeTab}?`)) return;

    try {
      await removeIPMutation.mutateAsync({ ipAddress });
      showToast({
        type: "success",
        title: "Success",
        message: "IP removed",
      });

      whitelistQuery.refetch();
      blacklistQuery.refetch();
      statsQuery.refetch();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to remove IP",
      });
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({ listType: activeTab });

      const element = document.createElement("a");
      element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(result.csv)}`);
      element.setAttribute("download", result.fileName);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast({
        type: "success",
        title: "Export Successful",
        message: `Exported to ${result.fileName}`,
      });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Export Failed",
        message: error.message || "Failed to export IPs",
      });
    }
  };

  const stats = statsQuery.data;
  const displayList =
    searchQuery.length > 0
      ? searchQuery_.data || []
      : activeTab === "whitelist"
        ? whitelistQuery.data || []
        : blacklistQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">IP Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage whitelisted and blacklisted IP addresses</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add IP
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Whitelisted IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalWhitelisted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Blacklisted IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.totalBlacklisted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Expired Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{stats.totalExpired}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add IP Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add IP Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">IP Address</label>
                <input
                  type="text"
                  value={newIP.ipAddress}
                  onChange={(e) => setNewIP({ ...newIP, ipAddress: e.target.value })}
                  placeholder="192.168.1.1"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Reason</label>
                <select
                  value={newIP.reason}
                  onChange={(e) => setNewIP({ ...newIP, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="trusted_partner">Trusted Partner</option>
                  <option value="known_attacker">Known Attacker</option>
                  <option value="vpn_provider">VPN Provider</option>
                  <option value="corporate_network">Corporate Network</option>
                  <option value="auto_blocked">Auto Blocked</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
              <input
                type="text"
                value={newIP.description}
                onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                placeholder="Add notes about this IP..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddIP}
                disabled={addToWhitelistMutation.isPending || addToBlacklistMutation.isPending}
              >
                Add to {activeTab}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("whitelist")}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === "whitelist" ? "border-green-600 text-green-600" : "border-transparent text-gray-600"
          }`}
        >
          Whitelist
        </button>
        <button
          onClick={() => setActiveTab("blacklist")}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === "blacklist" ? "border-red-600 text-red-600" : "border-transparent text-gray-600"
          }`}
        >
          Blacklist
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IP addresses..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            whitelistQuery.refetch();
            blacklistQuery.refetch();
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* IP List */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "whitelist" ? "Whitelisted" : "Blacklisted"} IPs</CardTitle>
          <CardDescription>Total: {displayList.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {displayList.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No IPs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-3">IP Address</th>
                    <th className="text-left py-2 px-3">Reason</th>
                    <th className="text-left py-2 px-3">Description</th>
                    <th className="text-left py-2 px-3">Expires</th>
                    <th className="text-right py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((ip, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono">{ip.ipAddress}</td>
                      <td className="py-2 px-3">{ip.reason}</td>
                      <td className="py-2 px-3">{ip.description || "-"}</td>
                      <td className="py-2 px-3">{ip.expiresAt ? new Date(ip.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td className="py-2 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveIP(ip.ipAddress)}
                          disabled={removeIPMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
