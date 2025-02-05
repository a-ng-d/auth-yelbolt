'use client'

export default function Icon(props: {
  color: string
  width: number
  height: number
}) {
  const { color = 'black', width = 128, height = 128 } = props

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.5714 8C22.9594 8 12 19.1451 12 32.8V95.2C12 108.855 22.9595 120 36.5714 120H91.4286C105.041 120 116 108.855 116 95.2V32.8C116 19.1451 105.041 8 91.4286 8H36.5714ZM20 32.8C20 23.4798 27.4608 16 36.5714 16H46V36C42.6863 36 40 38.6863 40 42V46H20V32.8ZM40 50H20V78H40V50ZM40 82H20V95.2C20 104.52 27.4608 112 36.5714 112H46V92C42.6863 92 40 89.3137 40 86V82ZM50 92V112H78V92H50ZM50 36H78V16H50V36ZM82 36C85.3137 36 88 38.6863 88 42V46H108V32.8C108 23.4798 100.539 16 91.4286 16H82V36ZM88 50V78H108V50H88ZM88 82V86C88 89.3137 85.3137 92 82 92V112H91.4286C100.539 112 108 104.52 108 95.2V82H88Z"
        fill={color}
      />
    </svg>
  )
}
