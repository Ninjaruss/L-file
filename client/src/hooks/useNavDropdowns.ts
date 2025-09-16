import { useDropdown } from './useDropdown'

export interface NavDropdowns {
  browse: ReturnType<typeof useDropdown>
  community: ReturnType<typeof useDropdown>
  submit: ReturnType<typeof useDropdown>
  closeAll: () => void
}

export function useNavDropdowns(): NavDropdowns {
  const closeAll = () => {
    browse[1].onClose()
    community[1].onClose()
    submit[1].onClose()
  }

  const browse = useDropdown({
    closeOthers: () => {
      community[1].onClose()
      submit[1].onClose()
    }
  })

  const community = useDropdown({
    closeOthers: () => {
      browse[1].onClose()
      submit[1].onClose()
    }
  })

  const submit = useDropdown({
    closeOthers: () => {
      browse[1].onClose()
      community[1].onClose()
    }
  })

  return {
    browse,
    community,
    submit,
    closeAll
  }
}