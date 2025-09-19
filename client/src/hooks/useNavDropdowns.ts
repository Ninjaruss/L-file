import { useDropdown } from './useDropdown'

export interface NavDropdowns {
  browse: ReturnType<typeof useDropdown>
  community: ReturnType<typeof useDropdown>
  submit: ReturnType<typeof useDropdown>
  closeAll: () => void
}

export function useNavDropdowns(): NavDropdowns {
  const closeAll = () => {
    browse[1].close()
    community[1].close()
    submit[1].close()
  }

  const browse = useDropdown({
    openDelay: 0,
    closeDelay: 400,
    closeOthers: () => {
      community[1].close()
      submit[1].close()
    }
  })

  const community = useDropdown({
    openDelay: 0,
    closeDelay: 400,
    closeOthers: () => {
      browse[1].close()
      submit[1].close()
    }
  })

  const submit = useDropdown({
    openDelay: 0,
    closeDelay: 400,
    closeOthers: () => {
      browse[1].close()
      community[1].close()
    }
  })

  return {
    browse,
    community,
    submit,
    closeAll
  }
}
