import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showQuickJumps?: boolean;
  maxVisiblePages?: number;
}

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className,
  showQuickJumps = true,
  maxVisiblePages = 5
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: number[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // 调整起始页码以保持可见页码数量
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return { pages, startPage, endPage }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    onPageChange(page)
  }

  const handleFirstPage = () => {
    onPageChange(1)
  }

  const handleLastPage = () => {
    onPageChange(totalPages)
  }

  const { pages, startPage, endPage } = getPageNumbers()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {/* 上一页按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        上一页
      </Button>

      {/* 第一页 */}
      {startPage > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFirstPage}
          className="min-w-[32px]"
        >
          1
        </Button>
      )}

      {/* 省略号 */}
      {startPage > 2 && (
        <span className="flex items-center justify-center h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </span>
      )}

      {/* 页码 */}
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePageClick(page)}
          className="min-w-[32px]"
        >
          {page}
        </Button>
      ))}

      {/* 省略号 */}
      {endPage < totalPages - 1 && (
        <span className="flex items-center justify-center h-8 w-8">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </span>
      )}

      {/* 最后一页 */}
      {endPage < totalPages && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLastPage}
          className="min-w-[32px]"
        >
          {totalPages}
        </Button>
      )}

      {/* 下一页按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="gap-1"
      >
        下一页
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 快速跳转（可选） */}
      {showQuickJumps && totalPages > 5 && (
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-sm text-muted-foreground">跳至</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            className="w-16 h-8 px-2 text-center border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt((e.target as HTMLInputElement).value)
                if (page && page >= 1 && page <= totalPages) {
                  onPageChange(page)
                }
              }
            }}
          />
          <span className="text-sm text-muted-foreground">页</span>
        </div>
      )}
    </div>
  )
}

export { Pagination }