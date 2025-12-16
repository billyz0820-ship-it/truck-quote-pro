import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface FilterValues {
  startDate: Date | undefined;
  endDate: Date | undefined;
  customerCode: string;
  customerName: string;
  recipient: string;
  carrier: string;
}

interface ExpressOrderFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
  onApply: () => void;
}

export function ExpressOrderFilters({ filters, onFiltersChange, onReset, onApply }: ExpressOrderFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.customerCode || filters.customerName || filters.recipient || filters.carrier;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          筛选
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {[filters.startDate, filters.endDate, filters.customerCode, filters.customerName, filters.recipient, filters.carrier].filter(Boolean).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">筛选条件</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
                <X className="h-4 w-4 mr-1" />
                清空
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">创建时间</label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      {filters.startDate ? format(filters.startDate, "yyyy-MM-dd", { locale: zhCN }) : "开始日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      {filters.endDate ? format(filters.endDate, "yyyy-MM-dd", { locale: zhCN }) : "结束日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">客户编码</label>
              <Input
                placeholder="输入客户编码"
                value={filters.customerCode}
                onChange={(e) => handleFilterChange("customerCode", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">客户名称</label>
              <Input
                placeholder="输入客户名称"
                value={filters.customerName}
                onChange={(e) => handleFilterChange("customerName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">收件人</label>
              <Input
                placeholder="输入收件人"
                value={filters.recipient}
                onChange={(e) => handleFilterChange("recipient", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">物流商</label>
              <Select value={filters.carrier} onValueChange={(value) => handleFilterChange("carrier", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择物流商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="USPS">USPS</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={() => {
            setOpen(false);
            onApply();
          }}>
            应用筛选
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
