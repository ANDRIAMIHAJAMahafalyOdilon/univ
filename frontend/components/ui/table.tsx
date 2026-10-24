'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  const [page, setPage] = React.useState(0)
  const body = React.Children.toArray(props.children).find(
    (child): child is React.ReactElement<{ children?: React.ReactNode }> =>
      React.isValidElement(child) && child.type === TableBody,
  )
  const bodyChildren = body ? React.Children.toArray(body.props.children) : []
  const dataRows = bodyChildren.filter((child) => React.isValidElement(child) && child.type === TableRow)
  const paginated = dataRows.length > 7
  const pageCount = Math.ceil(dataRows.length / 7)
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0))
  const visibleRows = paginated ? dataRows.slice(currentPage * 7, currentPage * 7 + 7) : dataRows
  const extraChildren = bodyChildren.filter((child) => !(React.isValidElement(child) && child.type === TableRow))
  const shownChildren = paginated
    ? [...extraChildren.filter((_, index) => currentPage === 0 || !index), ...visibleRows]
    : bodyChildren

  React.useEffect(() => {
    setPage(0)
  }, [dataRows.length])

  const tableChildren = body
    ? React.Children.map(props.children, (child) =>
        React.isValidElement(child) && child.type === TableBody
          ? React.cloneElement(child, undefined, shownChildren)
          : child,
      )
    : props.children

  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('min-w-full w-full caption-bottom text-[15px]', className)}
        {...props}
        children={tableChildren}
      />
      {paginated && (
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
          <span>Affichage {currentPage * 7 + 1}–{Math.min((currentPage + 1) * 7, dataRows.length)} sur {dataRows.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={currentPage === 0} aria-label="Page précédente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center">Page {currentPage + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.min(value + 1, pageCount - 1))} disabled={currentPage >= pageCount - 1} aria-label="Page suivante">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-12 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-4 py-3 text-center align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
