import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { Button, IconDownload, IconDownloadCloud, IconEye, Typography } from '@supabase/ui'
import DataGrid from '@supabase/react-data-grid'

import LogSelection from './LogSelection'
import { LogData } from './Logs.types'
import { isNil } from 'lodash'

interface Props {
  isCustomQuery: boolean
  data?: Array<LogData | Object>
}
type LogMap = { [id: string]: LogData }

/**
 * Logs table view with focus side panel
 *
 * When in custom data display mode, the side panel will not open when focusing on logs.
 */
const LogTable = ({ isCustomQuery, data = [] }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const columnNames = Object.keys(data[0] || {})
  // whether the data structure is LogData format.
  const hasLogDataFormat =
    columnNames.includes('timestamp') &&
    columnNames.includes('event_message') &&
    columnNames.length === 4

  const columns = (hasLogDataFormat ? ['timestamp', 'event_message'] : columnNames).map((v) => ({
    key: v,
    name: v,
    width: hasLogDataFormat && v === 'timestamp' ? 210 : undefined,
    resizable: true,
    headerRenderer: () => {
      return <div className="flex items-center text-xs font-mono h-full">{v}</div>
    },
    formatter: ({ row }: any) => {
      let value = row[v]
      if (hasLogDataFormat && v === 'timestamp') {
        value = dayjs(Number(row['timestamp']) / 1000).toISOString()
      }
      return (
        <p
          className={[
            'block whitespace-wrap font-mono',
            `${hasLogDataFormat && row.id === focusedLog?.id ? 'font-bold' : ''}`,
            `${hasLogDataFormat && v === 'timestamp' ? 'text-green-900' : ''}`,
          ].join(' ')}
        >
          {value}
        </p>
      )
    },
  }))

  const logMap = useMemo(() => {
    if (!hasLogDataFormat) return {} as LogMap
    const logData = data as LogData[]
    return logData.reduce((acc: LogMap, d: LogData) => {
      acc[d.id] = d
      return acc
    }, {}) as LogMap
  }, [JSON.stringify(data)])

  const stringData = JSON.stringify(data)
  useEffect(() => {
    if (!hasLogDataFormat) return
    if (isNil(data)) return
    if (focusedLog && !(focusedLog.id in logMap)) {
      setFocusedLog(null)
    }
  }, [stringData])

  if (!data) return null

  // [Joshen] Hmm quite hacky now, but will do
  const maxHeight = isCustomQuery ? 'calc(100vh - 42px - 10rem)' : 'calc(100vh - 42px - 3rem)'

  const logDataRows = useMemo(() => {
    if (!hasLogDataFormat) return data
    return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
  }, [stringData])
  return (
    <>
      <div
        className="w-full bg-scale-300 rounded rounded-b-none border-t border-l border-r
        flex items-center justify-between
        px-5 py-2
      "
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-scale-1200">Query results</span>
          <span className="text-sm text-scale-1100">4,256 log results</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="default" icon={<IconEye />}>
            Histogram
          </Button>
          <Button type="default" icon={<IconDownloadCloud />}>
            Download
          </Button>
        </div>
      </div>
      <section className="flex flex-1 flex-row" style={{ maxHeight }}>
        <DataGrid
          style={{ height: '100%' }}
          className="flex-grow flex-1"
          onSelectedCellChange={({ idx, rowIdx }) => {
            if (!hasLogDataFormat) return
            setFocusedLog(data[rowIdx] as LogData)
          }}
          noRowsFallback={
            <div className="p-4">
              <Typography.Text type="secondary" small className="font-mono">
                No data returned from query
              </Typography.Text>
            </div>
          }
          columns={columns as any}
          rowClass={(r) => {
            if (!hasLogDataFormat) return 'cursor-pointer'
            const row = r as LogData
            return `${row.id === focusedLog?.id ? 'bg-green-800' : 'cursor-pointer'}`
          }}
          rows={logDataRows}
          rowKeyGetter={(r) => {
            if (!hasLogDataFormat) return Object.keys(r)[0]
            const row = r as LogData
            return row.id
          }}
          onRowClick={(r) => {
            if (!hasLogDataFormat) return
            const row = r as LogData
            setFocusedLog(logMap[row.id])
          }}
        />
        {focusedLog && (
          <div className="w-2/5 flex flex-col">
            <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
          </div>
        )}
      </section>
    </>
  )
}
export default LogTable