import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Mail, Plus, Trash2, Copy, Edit2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NewGroupForm {
  name: string;
  description: string;
}

interface NewMemberForm {
  email: string;
  name: string;
  role: string;
  isPrimary: boolean;
}

export default function RecipientGroupManagement() {
  const [farms] = trpc.farms.list.useSuspenseQuery();
  const [selectedFarm, setSelectedFarm] = useState<number | null>(farms?.[0]?.id || null);

  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState<NewGroupForm>({
    name: "",
    description: "",
  });

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState<NewMemberForm>({
    email: "",
    name: "",
    role: "",
    isPrimary: false,
  });

  // Fetch groups for selected farm
  const { data: groups, refetch: refetchGroups } = trpc.recipientManagement.getGroupsForFarm.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  // Fetch selected group details
  const { data: selectedGroupData } = trpc.recipientManagement.getGroup.useQuery(
    { groupId: selectedGroup || 0 },
    { enabled: !!selectedGroup }
  );

  // Mutations
  const createGroup = trpc.recipientManagement.createGroup.useMutation();
  const updateGroup = trpc.recipientManagement.updateGroup.useMutation();
  const deleteGroup = trpc.recipientManagement.deleteGroup.useMutation();
  const cloneGroup = trpc.recipientManagement.cloneGroup.useMutation();
  const addMember = trpc.recipientManagement.addMember.useMutation();
  const removeMember = trpc.recipientManagement.removeMember.useMutation();
  const updateMember = trpc.recipientManagement.updateMember.useMutation();

  const handleCreateGroup = async () => {
    if (!selectedFarm || !newGroupForm.name.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createGroup.mutateAsync({
        farmId: selectedFarm,
        name: newGroupForm.name,
        description: newGroupForm.description,
      });

      setNewGroupForm({ name: "", description: "" });
      setShowNewGroupForm(false);
      refetchGroups();
    } catch (error) {
      alert(`Failed to create group: ${error}`);
    }
  };

  const handleCloneGroup = async (groupId: number) => {
    const newName = prompt("Enter name for cloned group:");
    if (!newName) return;

    try {
      await cloneGroup.mutateAsync({
        groupId,
        newName,
      });

      refetchGroups();
    } catch (error) {
      alert(`Failed to clone group: ${error}`);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      await deleteGroup.mutateAsync({ groupId });
      setSelectedGroup(null);
      refetchGroups();
    } catch (error) {
      alert(`Failed to delete group: ${error}`);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !newMemberForm.email.trim()) {
      alert("Please fill in email address");
      return;
    }

    try {
      await addMember.mutateAsync({
        groupId: selectedGroup,
        email: newMemberForm.email,
        name: newMemberForm.name || undefined,
        role: newMemberForm.role || undefined,
        isPrimary: newMemberForm.isPrimary,
      });

      setNewMemberForm({ email: "", name: "", role: "", isPrimary: false });
      setShowAddMemberForm(false);
      
      // Trigger refetch by updating selected group
      setSelectedGroup(null);
      setTimeout(() => setSelectedGroup(selectedGroup), 100);
    } catch (error: any) {
      alert(`Failed to add member: ${error.message || error}`);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember.mutateAsync({ memberId });
      
      // Trigger refetch
      setSelectedGroup(null);
      setTimeout(() => setSelectedGroup(selectedGroup), 100);
    } catch (error) {
      alert(`Failed to remove member: ${error}`);
    }
  };

  const handleSetPrimary = async (memberId: number) => {
    try {
      await updateMember.mutateAsync({
        memberId,
        isPrimary: true,
      });

      // Trigger refetch
      setSelectedGroup(null);
      setTimeout(() => setSelectedGroup(selectedGroup), 100);
    } catch (error) {
      alert(`Failed to update member: ${error}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Recipient Group Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage recipient groups for efficient report distribution
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Groups
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowNewGroupForm(true)}
                  disabled={!selectedFarm}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Farm Selection */}
              <Select
                value={selectedFarm?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedFarm(parseInt(value));
                  setSelectedGroup(null);
                }}
              >
                <SelectTrigger className="mb-4">
                  <SelectValue placeholder="Select a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Groups List */}
              <div className="space-y-2">
                {groups?.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedGroup === group.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-secondary border-border"
                    }`}
                  >
                    <p className="font-semibold text-sm">{group.name}</p>
                    <p className="text-xs opacity-75">{group.memberCount} members</p>
                  </button>
                ))}

                {!groups || groups.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No groups yet. Create one to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2 space-y-6">
          {showNewGroupForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Group Name</Label>
                  <Input
                    placeholder="e.g., Financial Team"
                    value={newGroupForm.name}
                    onChange={(e) =>
                      setNewGroupForm({ ...newGroupForm, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe the purpose of this group"
                    value={newGroupForm.description}
                    onChange={(e) =>
                      setNewGroupForm({ ...newGroupForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateGroup} disabled={createGroup.isPending}>
                    {createGroup.isPending ? "Creating..." : "Create Group"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewGroupForm(false);
                      setNewGroupForm({ name: "", description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedGroup && selectedGroupData && (
            <>
              {/* Group Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedGroupData.name}</CardTitle>
                      {selectedGroupData.description && (
                        <CardDescription>{selectedGroupData.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloneGroup(selectedGroup)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGroup(selectedGroup)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Members Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Members ({selectedGroupData.members?.length || 0})
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowAddMemberForm(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddMemberForm && (
                    <div className="border rounded-lg p-4 space-y-4 bg-secondary/50">
                      <div>
                        <Label>Email Address *</Label>
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={newMemberForm.email}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, email: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label>Name (Optional)</Label>
                        <Input
                          placeholder="John Doe"
                          value={newMemberForm.name}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, name: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label>Role (Optional)</Label>
                        <Input
                          placeholder="e.g., Manager, Accountant"
                          value={newMemberForm.role}
                          onChange={(e) =>
                            setNewMemberForm({ ...newMemberForm, role: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleAddMember} disabled={addMember.isPending}>
                          {addMember.isPending ? "Adding..." : "Add Member"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddMemberForm(false);
                            setNewMemberForm({ email: "", name: "", role: "", isPrimary: false });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2">
                    {selectedGroupData.members?.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{member.email}</p>
                          {member.name && (
                            <p className="text-xs text-muted-foreground">{member.name}</p>
                          )}
                          {member.role && (
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          )}
                          {member.isPrimary && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded mt-1 inline-block">
                              Primary Contact
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!member.isPrimary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimary(member.id)}
                              title="Set as primary contact"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {!selectedGroupData.members || selectedGroupData.members.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No members in this group yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedGroup && (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a group or create a new one to get started
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
