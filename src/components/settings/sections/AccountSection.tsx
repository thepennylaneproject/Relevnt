/**
 * AccountSection - User identity controls
 * 
 * Controls: Full Name, Email Address
 * Inline editing with commit on blur/Enter.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useProfileSettings } from '../../../hooks/useProfileSettings'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface AccountSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function AccountSection({ onAutoSaveStatusChange }: AccountSectionProps) {
    const { settings, saveSettings, updateEmail, saving } = useProfileSettings()
    
    const [isEditingName, setIsEditingName] = useState(false)
    const [nameValue, setNameValue] = useState('')
    const [nameSaved, setNameSaved] = useState(false)
    const [nameError, setNameError] = useState<string | null>(null)

    const [isEditingEmail, setIsEditingEmail] = useState(false)
    const [emailValue, setEmailValue] = useState('')
    const [emailSaved, setEmailSaved] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)

    const nameInputRef = useRef<HTMLInputElement>(null)
    const emailInputRef = useRef<HTMLInputElement>(null)

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus()
        }
    }, [isEditingName])

    useEffect(() => {
        if (isEditingEmail && emailInputRef.current) {
            emailInputRef.current.focus()
        }
    }, [isEditingEmail])

    const commitName = async () => {
        if (!settings || nameValue === settings.fullName) {
            setIsEditingName(false)
            return
        }
        setNameError(null)
        onAutoSaveStatusChange('saving')
        const success = await saveSettings({ fullName: nameValue })
        if (success) {
            setIsEditingName(false)
            setNameSaved(true)
            onAutoSaveStatusChange('saved')
            setTimeout(() => setNameSaved(false), 2000)
        } else {
            setNameError('Failed to save')
            onAutoSaveStatusChange('error')
        }
    }

    const commitEmail = async () => {
        if (!settings || emailValue === settings.email) {
            setIsEditingEmail(false)
            return
        }
        setEmailError(null)
        onAutoSaveStatusChange('saving')
        const result = await updateEmail(emailValue)
        if (result.success) {
            setIsEditingEmail(false)
            setEmailSaved(true)
            onAutoSaveStatusChange('saved')
        } else {
            setEmailError(result.error || 'Failed to update')
            onAutoSaveStatusChange('error')
        }
    }

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitName()
        } else if (e.key === 'Escape') {
            setIsEditingName(false)
        }
    }

    const handleEmailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            commitEmail()
        } else if (e.key === 'Escape') {
            setIsEditingEmail(false)
        }
    }

    if (!settings) return null

    return (
        <div className="settings-fields">
                <div className="settings-field">
                    <div className="settings-field-header">
                        <span className="settings-field-label">Full name</span>
                        {!isEditingName && (
                            <button 
                                className="settings-edit-link"
                                onClick={() => {
                                    setNameValue(settings.fullName)
                                    setIsEditingName(true)
                                }}
                            >
                                edit
                            </button>
                        )}
                    </div>

                    {isEditingName ? (
                        <div className="settings-field-edit">
                            <input
                                ref={nameInputRef}
                                type="text"
                                className="settings-input"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                onBlur={commitName}
                                onKeyDown={handleNameKeyDown}
                            />
                            {nameError && <span className="settings-error">{nameError}</span>}
                        </div>
                    ) : (
                        <div className="settings-field-value">
                            <span>{settings.fullName || '—'}</span>
                            {nameSaved && <span className="settings-saved-indicator">saved</span>}
                        </div>
                    )}
                </div>

                <div className="settings-field">
                    <div className="settings-field-header">
                        <span className="settings-field-label">Email</span>
                        {!isEditingEmail && (
                            <button 
                                className="settings-edit-link"
                                onClick={() => {
                                    setEmailValue(settings.email)
                                    setIsEditingEmail(true)
                                    setEmailSaved(false)
                                }}
                            >
                                edit
                            </button>
                        )}
                    </div>

                    {isEditingEmail ? (
                        <div className="settings-field-edit">
                            <input
                                ref={emailInputRef}
                                type="email"
                                className="settings-input"
                                value={emailValue}
                                onChange={(e) => setEmailValue(e.target.value)}
                                onBlur={commitEmail}
                                onKeyDown={handleEmailKeyDown}
                            />
                            {emailError && <span className="settings-error">{emailError}</span>}
                        </div>
                    ) : (
                        <div className="settings-field-value">
                            <span>{settings.email}</span>
                            {emailSaved && <span className="settings-confirmation">verification sent</span>}
                        </div>
                    )}
                </div>
        </div>
    )
}

