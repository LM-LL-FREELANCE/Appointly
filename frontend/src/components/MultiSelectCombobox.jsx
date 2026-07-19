import { useState } from 'react'
import { Combobox, PillsInput, Pill, CheckIcon, Group, useCombobox } from '@mantine/core'

export function MultiSelectCombobox({ label, data, value, onChange, placeholder, maxSelected, size }) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })
  const [search, setSearch] = useState('')

  const limitReached = maxSelected != null && value.length >= maxSelected

  const handleValueSelect = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val))
    } else if (!limitReached) {
      onChange([...value, val])
    }
  }

  const handleValueRemove = (val) => onChange(value.filter((v) => v !== val))

  const options = data
    .filter((item) => item.toLowerCase().includes(search.trim().toLowerCase()))
    .map((item) => {
      const selected = value.includes(item)
      return (
        <Combobox.Option value={item} key={item} active={selected} disabled={!selected && limitReached}>
          <Group gap="sm">
            {selected ? <CheckIcon size={12} /> : null}
            <span>{item}</span>
          </Group>
        </Combobox.Option>
      )
    })

  const pills = value.map((item) => (
    <Pill key={item} size={size} withRemoveButton onRemove={() => handleValueRemove(item)}>
      {item}
    </Pill>
  ))

  return (
    <Combobox store={combobox} size={size} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput label={label} size={size} onClick={() => combobox.openDropdown()}>
          <Pill.Group>
            {pills}
            {!limitReached && (
              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  value={search}
                  placeholder={placeholder}
                  onChange={(e) => {
                    combobox.updateSelectedOptionIndex()
                    setSearch(e.currentTarget.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && search.length === 0) {
                      e.preventDefault()
                      handleValueRemove(value[value.length - 1])
                    }
                  }}
                />
              </Combobox.EventsTarget>
            )}
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length > 0
            ? options
            : (
              <Combobox.Empty>
                {limitReached ? `Máximo ${maxSelected} seleccionado${maxSelected > 1 ? 's' : ''}` : 'Nada encontrado'}
              </Combobox.Empty>
            )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
