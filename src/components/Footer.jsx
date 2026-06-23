function Footer() {
  return (
    <footer className="border-t border-slate-800 py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-slate-400 md:px-6">
        <p>
          <a
            href="https://github.com/Cloud2BR"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-300 transition hover:text-white"
          >
            Cloud2BR
          </a>{' '}
          • FIFA World Cup History Albums
        </p>
        <p>Data is for educational and historical reference.</p>
      </div>
    </footer>
  )
}

export default Footer
