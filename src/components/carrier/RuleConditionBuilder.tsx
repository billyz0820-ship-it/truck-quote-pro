import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Operator = "AND" | "OR";
type Comparator = "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than";

interface Condition {
  id: string;
  field: string;
  comparator: Comparator;
  value: string;
}

interface ConditionGroup {
  id: string;
  operator: Operator;
  conditions: Condition[];
  groups: ConditionGroup[];
}

interface RuleConditionBuilderProps {
  value: ConditionGroup;
  onChange: (value: ConditionGroup) => void;
}

const FIELDS = [
  { value: "customer_code", label: "客户编码" },
  { value: "warehouse", label: "发货仓库" },
  { value: "carrier", label: "物流商" },
  { value: "service_type", label: "物流服务" },
  { value: "zip_code", label: "邮编" },
  { value: "state", label: "州" },
  { value: "city", label: "城市" },
  { value: "address_type", label: "地址类型" },
  { value: "weight", label: "重量" },
  { value: "zone", label: "分区" },
];

const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: "equals", label: "等于" },
  { value: "not_equals", label: "不等于" },
  { value: "contains", label: "包含" },
  { value: "not_contains", label: "不包含" },
  { value: "greater_than", label: "大于" },
  { value: "less_than", label: "小于" },
];

export function RuleConditionBuilder({ value, onChange }: RuleConditionBuilderProps) {
  const addCondition = (groupId: string) => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      field: "customer_code",
      comparator: "equals",
      value: "",
    };

    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, newCondition],
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.filter(c => c.id !== conditionId),
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<Condition>) => {
    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: group.conditions.map(c =>
            c.id === conditionId ? { ...c, ...updates } : c
          ),
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const addGroup = (parentId: string) => {
    const newGroup: ConditionGroup = {
      id: `group_${Date.now()}`,
      operator: "AND",
      conditions: [],
      groups: [],
    };

    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === parentId) {
        return {
          ...group,
          groups: [...group.groups, newGroup],
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const removeGroup = (parentId: string, groupId: string) => {
    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === parentId) {
        return {
          ...group,
          groups: group.groups.filter(g => g.id !== groupId),
        };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const updateGroupOperator = (groupId: string, operator: Operator) => {
    const updateGroup = (group: ConditionGroup): ConditionGroup => {
      if (group.id === groupId) {
        return { ...group, operator };
      }
      return {
        ...group,
        groups: group.groups.map(updateGroup),
      };
    };

    onChange(updateGroup(value));
  };

  const renderGroup = (group: ConditionGroup, depth: number = 0): JSX.Element => {
    return (
      <div
        key={group.id}
        className={`border rounded-lg p-4 space-y-3 ${depth > 0 ? "ml-6 mt-2" : ""}`}
        style={{ borderColor: depth % 2 === 0 ? "hsl(var(--border))" : "hsl(var(--muted))" }}
      >
        <div className="flex items-center gap-2">
          <Select
            value={group.operator}
            onValueChange={(val) => updateGroupOperator(group.id, val as Operator)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">与 (AND)</SelectItem>
              <SelectItem value="OR">或 (OR)</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">组 {depth + 1}</Badge>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => addCondition(group.id)}>
            <Plus className="h-3 w-3 mr-1" />
            条件
          </Button>
          <Button size="sm" variant="outline" onClick={() => addGroup(group.id)}>
            <Plus className="h-3 w-3 mr-1" />
            子组
          </Button>
        </div>

        {group.conditions.map((condition, index) => (
          <div key={condition.id} className="flex items-center gap-2">
            {index > 0 && (
              <Badge variant="secondary" className="w-16">
                {group.operator}
              </Badge>
            )}
            <Select
              value={condition.field}
              onValueChange={(val) => updateCondition(group.id, condition.id, { field: val })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={condition.comparator}
              onValueChange={(val) => updateCondition(group.id, condition.id, { comparator: val as Comparator })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARATORS.map(comp => (
                  <SelectItem key={comp.value} value={comp.value}>
                    {comp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={condition.value}
              onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
              placeholder="值"
              className="flex-1"
            />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeCondition(group.id, condition.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {group.groups.map(subGroup => renderGroup(subGroup, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">规则条件配置</h3>
        <p className="text-xs text-muted-foreground">
          支持复杂逻辑：与(AND)、或(OR)、嵌套分组
        </p>
      </div>
      {renderGroup(value)}
    </div>
  );
}
