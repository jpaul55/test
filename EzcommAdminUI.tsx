import React, {useState, useEffect, useRef} from 'react';
import { Box } from '@uhg-abyss/web/ui/Box';
import {TextInput} from '@uhg-abyss/web/ui/TextInput';
import {SelectInput} from '@uhg-abyss/web/ui/SelectInput';
import {Label} from '@uhg-abyss/web/ui/Label';
import { RadioGroup } from '@uhg-abyss/web/ui/RadioGroup';
import { FormProvider } from '@uhg-abyss/web/ui/FormProvider';
import { TextInputArea } from '@uhg-abyss/web/ui/TextInputArea';
import { useForm } from '@uhg-abyss/web/hooks/useForm';
import { Card } from '@uhg-abyss/web/ui/Card';
import { Table } from '@uhg-abyss/web/ui/Table';
import { Button } from '@uhg-abyss/web/ui/Button';
import { Modal } from '@uhg-abyss/web/ui/Modal';
import { IconMaterial } from '@uhg-abyss/web/ui/IconMaterial';
import { config } from '@uhg-abyss/web/tools/config';
import axios from 'axios';
import EmailTemplateSurest from '../../common/Template/EmailTemplateSurest';
import EmailTemplateDefault from '../../common/Template/EmailTemplateDefault';
import SMSTemplate from '../../common/Template/SMSTemplate';
import DOMPurify from 'dompurify';
import { deleteProgram } from './deleteProgram';

interface FilterEntry {
  filterEntryId: number;
  category: string;
  rule: string;
  value: string;
  delete?: boolean;
}

export const EzcommAdminUI = () => {
  const [clientLaunchContextValue, setClientLaunchContextValue] = useState('');
  const [menuEntityId, setMenuEntityId] = useState('');
  const [menuEntityIdNew , setMenuEntityIdNew] = useState(0);
  const [campaignName, setCampaignName] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newUrlLabel, setNewUrlLabel] = useState('');
  const [newUrlLink, setNewUrlLink] = useState('');
  const [newUrlLinkInput, setNewUrlLinkInput] = useState('');
  const [newUrlLabelInput, setNewUrlLabelInput] = useState('');
  const [showNewFields, setShowNewFields] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [template, setTemplate] = useState('');
  const [messageTemplates, setMessageTemplates] = useState([]);
  const [selectedMessageTemplate, setSelectedMessageTemplate] = useState('');
  const [program, setProgram] = React.useState('');
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [title, setTitle] = useState('');
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterCategoryItems, setFilterCategoryItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [valueOptions, setValueOptions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [filters, setFilters] = useState<FilterEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showLine, setShowLine] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showRemoveExceptionModal, setShowRemoveExceptionModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showInfoRemoveModal, setShowInfoRemoveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignSuggestions, setCampaignSuggestions] = useState<string[]>([]);
  const [editDisabled, setEditDisabled] = useState(true);
  const [createDisabled, setCreateDisabled] = useState(true);
  const [clientContextMap, setClientContextMap] = useState({});
  const [clientContextOptions, setClientContextOptions] = useState([]);
  const [onConfirm, setOnConfirm] = useState('');
  const [onCancel, setOnCancel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState('');
  const [isRemoveEnabled, setIsRemoveEnabled] = useState(false);
  const [newCampaignNameEnabled, setNewCampaignNameEnabled] = useState(false);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [campaignId, setCampaignId] = useState<number>();
  const [displayedText, setDisplayedText] = useState("create");
  const [displayedTextNew, setDisplayedTextNew] = useState("created");
  const [standardTemplateId, setStandardTemplateId] = useState('');
  const [isAddButtonDisabled, setIsAddButtonDisabled] = useState(false);
  const [urlLinkEmail, setUrlLinkEmail] = useState('');
  const [urlLinkSMS, setUrlLinkSMS] = useState('');
  const [urlLabel, setUrlLabel] = useState('');
  const [BoB, setBoB] = useState<string>('');
  const [subjectLine, setSubjectLine] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [campaignDisclaimer, setCampaignDisclaimer] = useState<string>('');
  const [defaultDisclaimer, setDefaultDisclaimer] = useState<string>('');
  const [showBoBModal, setShowBoBModal] = useState(false);
  const [showBoBSuccessModal, setShowBoBSuccessModal] = useState(false);
  const [showBoBDeleteErrorModal, setShowBoBDeleteErrorModal] = useState(false);
  const [showBoBDeleteSuccessModal, setShowBoBDeleteSuccessModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showProgramSuccessModal, setShowProgramSuccessModal] = useState(false);
  const [savedProgramDescription, setSavedProgramDescription] = useState<string>('');
  // Add state for delete-success modal and deleted description
  const [deletedProgramDescription, setDeletedProgramDescription] = useState<string>('');
  // Missing states for Program delete error/success handling
  const [showProgramDeleteErrorModal, setShowProgramDeleteErrorModal] = useState(false);
  const [showProgramDeleteSuccessModal, setShowProgramDeleteSuccessModal] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string>('');
  // States for generic success/error modals
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [programItems, setProgramItems] = useState<Array<{
    campaignId: number,
    programDescription: string,
    programId: string,
    clientId: string,
    senderName: string,
    senderEmail: string,
    smsManagerSettingId: number,
    emailSettingId: number
  }>>([]);
  // Store original program items to track edits
  const [originalProgramItems, setOriginalProgramItems] = useState<Array<{
    campaignId: number,
    programDescription: string,
    programId: string,
    clientId: string,
    senderName: string,
    senderEmail: string,
    smsManagerSettingId: number,
    emailSettingId: number
  }>>([]);
  const [savedBobDescription, setSavedBobDescription] = useState<string>('');
  const [deletedBobDescription, setDeletedBobDescription] = useState<string>('');
  const [linkedCampaigns, setLinkedCampaigns] = useState<string[]>([]);
  const [bobItems, setBobItems] = useState<Array<{code: string, description: string, id: number}>>([]);
  const [newBobFields, setNewBobFields] = useState<Array<{tempId: string, description: string, code: string}>>([
    { tempId: '1', description: '', code: '' }
  ]);
  const [newProgramFields, setNewProgramFields] = useState<Array<{
    tempId: string,
    programDescription: string,
    programId: string,
    clientId: string,
    senderName: string,
    senderEmail: string
  }>>([
    { tempId: '1', programDescription: '', programId: '', clientId: '', senderName: '', senderEmail: '' }
  ]);
  // Track validation errors for new program fields
  const [programIdErrors, setProgramIdErrors] = useState<Record<string, string>>({});
  const [dropdownResetKey, setDropdownResetKey] = useState(0);
  const [programDropdownResetKey, setProgramDropdownResetKey] = useState(0);
  const bobDropdownRef = useRef<any>(null);
  const [newFilter, setNewFilter] = useState({
    category: "",
    rule: "",
    value: "",
    delete: false,
  });
  const form = useForm();
  const [value, setValue] = React.useState('');
  const activeProfiles = config('ENV_VAR');
  const riptideEzcommUiHost = activeProfiles.includes("prod") ? 'https://riptide-micro-ui.optum.com' : 'https://non-prod-riptide-micro-ui.optum.com';

  const handleClientLaunchContextChange = (event) => {
    const value = event?.target?.value || '';
    setClientLaunchContextValue(value);
    setErrors(prevErrors => ({ ...prevErrors, newCampaignName: value ? '' : 'New Campaign Name is required' }));
  };

  const handleCampaignNameChange = async (event) => {
    const value = event?.target?.value || '';
    setCampaignName(value);

    if (value && clientLaunchContextValue) {
      const clientContextId = clientContextMap[clientLaunchContextValue];
      if (clientContextId) {
        try {
          const response = await axios.get(`/admin/campaigns?clientContextId=${clientContextId}`);
          const filteredSuggestions = response.data
            .filter((campaign) => campaign.name.toLowerCase().includes(value.toLowerCase()))
            .map((campaign) => campaign.name);
          setCampaignSuggestions(filteredSuggestions);
        } catch (error) {
          console.error('Error fetching campaign suggestions:', error);
        }
      }
    } else {
      setCampaignSuggestions([]);
    }
  };


   const fetchCampaignDetails = async (menuEntityId: number) => {
     try {
       const response = await axios.get(`/admin/menu-entity/${menuEntityId}`);
       const [fetchedTitle, fetchedDescription, Id] = response.data[0] || ['', ''];

       const sanitizedTitle = fetchedTitle ? String(fetchedTitle).replace(/,+$/, '').trim() : '';

       setTitle(sanitizedTitle);
       setDescription(fetchedDescription);
       setCampaignId(Id);


     } catch (error) {
       console.error('Error fetching campaign details:', error);
     }
   };
  const handleNewCampaignNameChange = (event) => {
      setNewCampaignName(event?.target?.value || '');
    };

  const handleCreateClick = () => {
      setShowNewFields(true);
      setNewCampaignName('');
      setNewCampaignNameEnabled(true);
      setIsDropdownDisabled(true);
      setIsCreateMode(true);
    };

  const handleEditClick = async () => {
    setShowNewFields(true);
    setNewCampaignNameEnabled(true);
    setIsDropdownDisabled(true);
    setIsCreateMode(false);
    setDisplayedText("edit");
    setDisplayedTextNew("edited")

    const campaignData = campaigns.find((campaign: any) => campaign.name === campaignName);

    if (campaignData) {
      // Set menuEntityIdNew from cached data
      setMenuEntityIdNew(campaignData.menuId);

      // Fetch additional details only if needed (title, description)
      if (campaignData.menuId) {
        fetchCampaignDetails(campaignData.menuId);
      }

      // Populate form fields directly from cached campaign data
      // Use campaignName from API response instead of name
      setNewCampaignName(campaignData.campaignName || campaignData.name);
      setUrlLinkEmail(campaignData.urlLinkEmail || '');
      setUrlLinkSMS(campaignData.urlLinkSMS || '');
      setUrlLabel(campaignData.urlLabel || '');
      setFilters(campaignData.campaignFilters || []);
      setCampaignId(campaignData.settingId || null);
      setTemplate(campaignData.messageTemplateId);
      setStandardTemplateId(campaignData.standardTemplateId);

      // Convert to string to ensure type consistency with SelectInput options
      const templateIdString = String(campaignData.messageTemplateId || '');
      console.log('Setting selectedMessageTemplate to:', templateIdString);
      setSelectedMessageTemplate(templateIdString);

      setSubjectLine(campaignData.subjectLine || '');
      setSenderEmail(campaignData.senderEmail || '');
      setCampaignDisclaimer(campaignData.disclaimer || '');
      setDefaultDisclaimer(campaignData.defaultDisclaimer || '');

      // Log the values being set - including template values
      console.log('Setting state values in handleEditClick:', {
        campaignName: campaignData.campaignName || campaignData.name,
        messageTemplateId: campaignData.messageTemplateId,
        standardTemplateId: campaignData.standardTemplateId,
        selectedMessageTemplate: campaignData.messageTemplateId,
        subjectLine: campaignData.subjectLine || '',
        senderEmail: campaignData.senderEmail || '',
        campaignDisclaimer: campaignData.disclaimer || '',
        defaultDisclaimer: campaignData.defaultDisclaimer || ''
      });

      // Determine the template type to auto-select
      if (campaignData.templateTypes.includes('EMAIL') && campaignData.templateTypes.includes('SMS')) {
        setSelectedTemplateType('Both');
      } else if (campaignData.templateTypes.includes('EMAIL')) {
        setSelectedTemplateType('Email');
      } else if (campaignData.templateTypes.includes('SMS')) {
        setSelectedTemplateType('SMS');
      }
    }
  };

  const handleSaveClick = () => {
    setShowModal(true);
    setIsOpen(true);
  };

  const handleModalSave = () => {
        console.log('Saving new campaign:', newCampaignName);
        setShowModal(false);
        setIsOpen(false);
        setShowInfoModal(true);
      };

  const handleModalCancel = () => {
      setShowModal(true);
      setIsOpen(false);
    };

const handleSave = async () => {
  const clientContextId = clientContextMap[clientLaunchContextValue];
  const payload = {
    clientContextId: clientContextId,
    name: campaignName,
    campaignName: newCampaignName,
    urlLinkEmail: urlLinkEmail,
    urlLinkSMS: urlLinkSMS,
    urlLabel: urlLabel,
    settingId: selectedProgram,
    templateTypes: selectedTemplateType === 'Both' ? ['EMAIL', 'SMS'] : [selectedTemplateType.toUpperCase()],
    campaignFilters: filters,
    messageTemplateId: template,
    standardTemplateId: standardTemplateId,
    title: title,
    description: description,
    subjectLine: subjectLine,
    senderEmail: senderEmail,
    disclaimer: campaignDisclaimer,
  };
  try {
    if (menuEntityIdNew) {
      // EDIT mode: Update existing entry
      await axios.put(`/admin/campaigns/${menuEntityIdNew}`, payload);
      console.log('Campaign updated successfully');
    } else {
      // CREATE mode: Add new entry
      await axios.post('/admin/campaigns', payload);
      console.log('Campaign created successfully');
    }
    setShowInfoModal(true);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    setIsOpen(false);
    setShowExceptionModal(true);
    return false;
  }
};

  const handleClose = () => {
      setIsOpen(false);
    };

  const handleTemplateChange = (event) => {
      setTemplate(event.target.value);
    };


  const handleRemove = () => {
    axios
      .delete(`/admin/campaigns/${menuEntityIdNew}`)
      .then(() => {
        setShowInfoRemoveModal(true);
      })
      .catch((error) => {
        console.error('Error removing campaign:', error);
        setShowRemoveModal(false);
        setShowRemoveExceptionModal(true);
      });
  };

  const handleAdd = () => {
    if (newFilter.category && newFilter.rule && newFilter.value) {
      setFilters((prevFilters) => [
        ...prevFilters,
        {
          filterEntryId: Date.now(), // Use a unique ID for the new filter
          ...newFilter,
          delete: false, // Ensure the new filter has delete set to false
        },
      ]);

      // Reset the new filter state
      setNewFilter({
        category: "",
        rule: "",
        value: "",
        delete: false,
      });
      setSelectedCategory("");
      setIsAddButtonDisabled(false);
    }
  };

  const handleDelete = (filterEntryId: number) => {
    setFilters((prevFilters) =>
        prevFilters.map((filter) =>
            filter.filterEntryId === filterEntryId
                ? { ...filter, delete: true } // Mark the filter as deleted
                : filter
        )
    );
  };

   useEffect(() => {
     setButtonDisabled(!(newFilter.category && newFilter.rule && newFilter.value));
   }, [newFilter]);



  const handleCollapseOnClick = (e, state) => {
    console.log('click event', e);
    console.log('open state', state);
  };


  // Fetch message templates from the backend API - only once on component mount
    useEffect(() => {
      const fetchMessageTemplates = async () => {
        try {
          const response = await axios.get('/admin/templates/messageTemplates');
          const messageTemplates = response.data.map((messageTemplate) => ({
            value: String(messageTemplate.messageTemplateId),
            label: messageTemplate.name,
          }));
          setMessageTemplates(messageTemplates);
        } catch (error) {
          console.error('Error fetching messageTemplates:', error);
        }
      };
      fetchMessageTemplates();
    }, []); // Empty dependency array - only fetch once on mount


    const handleMessageTemplateChange = (value) => {
      console.log('Selected message template value:', value);
      setSelectedMessageTemplate(value);
      setStandardTemplateId(value);
      setTemplate(value);
    };


  // Move fetchPrograms outside of useEffect so it can be called anywhere
  const fetchPrograms = async () => {
    try {
      const response = await axios.get('/admin/programs');
      const programOptions = response.data.map((program) => ({
        value: program.settingId,
        label: program.description,
        senderEmail: program.senderEmail,
      }));
      // Add "Add new program" option at the beginning
      const optionsWithAddNew = [
        { value: 'ADD_NEW_PROGRAM', label: '+ Add new program', senderEmail: '' },
        ...programOptions
      ];
      setPrograms(optionsWithAddNew);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  // Fetch programs from the backend API - only once on component mount
    useEffect(() => {
      // Use the top-level fetchPrograms so it is available elsewhere (e.g. after delete)
      fetchPrograms();
    }, []); // Empty dependency array - only fetch once on mount


    const handleProgramChange = (value) => {
      // Check if "Add new program" option is selected
      if (value === 'ADD_NEW_PROGRAM') {
        setShowProgramModal(true);
        return; // Don't update selectedProgram
      }

      setSelectedProgram(value); // Update the selected program in state

      // Find the selected program and update sender email
      const program = programs.find((p) => p.value === value);
      console.log('Found program:', program);

      if (program && program.senderEmail) {
        console.log('Setting sender email to:', program.senderEmail);
        setSenderEmail(program.senderEmail);
      } else {
        console.log('No sender email found, clearing field');
        setSenderEmail(''); // Clear if no senderEmail found
      }
    };

    // Handler function for deleting a Program ID
    const handleDeleteProgramId = async (item: typeof programItems[0]) => {
      try {
        // DEBUG: Log all item properties
        console.log('=== DELETE DEBUG ===');
        console.log('Full item object:', JSON.stringify(item, null, 2));
        console.log('item.campaignId:', item.campaignId);
        console.log('item.smsManagerSettingId:', item.smsManagerSettingId);
        console.log('item.emailSettingId:', item.emailSettingId);
        console.log('item.programId:', item.programId);
        console.log('item.programDescription:', item.programDescription);
        console.log('====================');

        // Call backend to delete the Program ID
        const response = await axios.delete(`/admin/program-ids/${item.smsManagerSettingId}`);
        console.log('Delete response:', response.data);

        if (response.data.success) {
          console.log('Delete was successful, proceeding with data refresh...');

          // Store deleted Program ID description for modal FIRST
          const deletedDesc = item.programDescription || item.programId || 'Program ID';
          console.log('Setting deleted description to:', deletedDesc);
          setDeletedProgramDescription(deletedDesc);

          // Remove from local state
          console.log('Removing from programItems array...');
          setProgramItems(programItems.filter(prog => prog.smsManagerSettingId !== item.smsManagerSettingId));

          // Refresh programs dropdown in main form - wait for completion
          console.log('Refreshing programs dropdown...');
          const refreshResponse = await axios.get('/admin/programs');
          const programOptions = refreshResponse.data.map((program: any) => ({
            value: program.settingId,
            label: program.description,
            senderEmail: program.senderEmail,
          }));
          setPrograms(programOptions);
          console.log('Programs dropdown refreshed successfully');

          // Small delay to ensure all state updates are processed
          await new Promise(resolve => setTimeout(resolve, 100));

          // Show delete success modal
          console.log('Showing success modal...');
          setShowProgramDeleteSuccessModal(true);
        } else {
          console.error('Delete failed with success=false:', response.data);
          alert('Failed to delete Program ID: ' + (response.data.message || 'Unknown error'));
        }
      } catch (error: any) {
        console.error('Error deleting Program ID:', error);
        console.error('Error response:', error.response);

        if (error.response?.status === 409) {
          // Conflict - Program ID is tied to campaigns
          console.log('Program ID is tied to campaigns, showing error modal');
          console.log('Linked campaigns:', error.response?.data?.linkedCampaigns);

          // Store linked campaigns from response
          if (error.response?.data?.linkedCampaigns) {
            setLinkedCampaigns(error.response.data.linkedCampaigns);
          }

          setShowProgramDeleteErrorModal(true);
        } else {
          const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
          alert('Error deleting Program ID: ' + errorMsg);
        }
      }
    };

    // Handler function for saving Program IDs
    const handleSaveProgramIds = async () => {
      try {
        console.log('Saving Program IDs');

        // Validate new program fields - check if any have content but missing Program ID
        const errors: Record<string, string> = {};
        let hasValidationError = false;

        newProgramFields.forEach(field => {
          // Check if any field has content (user started filling out this row)
          const hasAnyContent = 
            field.programDescription?.trim() || 
            field.programId?.trim() || 
            field.clientId?.trim() || 
            field.senderName?.trim() || 
            field.senderEmail?.trim();

          // If row has content but Program ID is empty, show error
          if (hasAnyContent && !field.programId?.trim()) {
            errors[field.tempId] = 'Program ID is required';
            hasValidationError = true;
          }
        });

        setProgramIdErrors(errors);

        if (hasValidationError) {
          console.log('Validation failed - Program ID is required');
          return; // Stop save if validation fails
        }

        const itemsToSave: any[] = [];

        // Helper function to normalize values for comparison (null, undefined, '' are all treated as empty)
        const normalize = (val: any): string => (val ?? '').toString().trim();

        // 1. Find EDITED existing items by comparing with original
        programItems.forEach(currentItem => {
          const originalItem = originalProgramItems.find(
            orig => orig.smsManagerSettingId === currentItem.smsManagerSettingId
          );
          
          if (originalItem) {
            // Check if any editable field was changed (normalize to handle null vs '' vs undefined)
            const hasChanges = 
              normalize(currentItem.programDescription) !== normalize(originalItem.programDescription) ||
              normalize(currentItem.clientId) !== normalize(originalItem.clientId) ||
              normalize(currentItem.senderName) !== normalize(originalItem.senderName) ||
              normalize(currentItem.senderEmail) !== normalize(originalItem.senderEmail);
            
            if (hasChanges) {
              console.log('Found edited item:', currentItem.smsManagerSettingId);
              console.log('  Original:', {
                programDescription: originalItem.programDescription,
                clientId: originalItem.clientId,
                senderName: originalItem.senderName,
                senderEmail: originalItem.senderEmail
              });
              console.log('  Current:', {
                programDescription: currentItem.programDescription,
                clientId: currentItem.clientId,
                senderName: currentItem.senderName,
                senderEmail: currentItem.senderEmail
              });
              itemsToSave.push({
                settingId: currentItem.smsManagerSettingId,
                programId: currentItem.programId,
                programIdDescription: currentItem.programDescription || '',
                oauthClientId: currentItem.clientId?.trim() || null,
                senderName: currentItem.senderName?.trim() || '',
                senderEmail: currentItem.senderEmail?.trim() || '',
                epmpProgramFlag: 'N',
                epmpCategory: '',
              });
            }
          }
        });

        // 2. Add NEW Program IDs (only if programId is filled)
        const filledNewPrograms = newProgramFields.filter(f => f.programId.trim() !== '');
        
        filledNewPrograms.forEach(newItem => {
          itemsToSave.push({
            settingId: null, // null for new items
            programId: newItem.programId.trim(),
            programIdDescription: newItem.programDescription?.trim() || '',
            oauthClientId: newItem.clientId?.trim() || null,
            senderName: newItem.senderName?.trim() || '',
            senderEmail: newItem.senderEmail?.trim() || '',
            epmpProgramFlag: 'N',
            epmpCategory: '',
          });
        });

        // If nothing to save (no edits and no new items), just close
        if (itemsToSave.length === 0) {
          console.log('No changes to save');
          setShowProgramModal(false);
          return;
        }

        console.log('Saving edited + new Program IDs:', itemsToSave);

        // Call backend to save
        const response = await axios.post('/admin/program-ids', {
          programItems: itemsToSave
        });

        console.log('Save response:', response.data);

        // Refresh the Program IDs list using the same endpoint as modal open
        const refreshResponse = await axios.get('/admin/program-details');
        setProgramItems(refreshResponse.data);
        // Update original items to reflect saved state
        setOriginalProgramItems(JSON.parse(JSON.stringify(refreshResponse.data)));

        // Reset new fields and clear validation errors
        setNewProgramFields([{ tempId: '1', programId: '', programDescription: '', clientId: '', senderName: '', senderEmail: '' }]);
        setProgramIdErrors({});

        // Show success modal instead of alert
        const editedCount = itemsToSave.filter(item => item.settingId !== null).length;
        const newItemsCount = filledNewPrograms.length;
        
        let successMsg = '';
        if (editedCount > 0 && newItemsCount > 0) {
          successMsg = `Updated ${editedCount} and added ${newItemsCount} Program ID${newItemsCount > 1 ? 's' : ''} successfully!`;
        } else if (editedCount > 0) {
          successMsg = `Updated ${editedCount} Program ID${editedCount > 1 ? 's' : ''} successfully!`;
        } else if (newItemsCount > 0) {
          successMsg = `Added ${newItemsCount} new Program ID${newItemsCount > 1 ? 's' : ''} successfully!`;
        } else {
          successMsg = 'Program IDs updated successfully!';
        }

        setSuccessMessage(successMsg);
        setShowSuccessModal(true);

        // Close modal
        setShowProgramModal(false);

      } catch (error) {
        console.error('Error saving Program IDs:', error);
        console.error('Error details:', error.response?.data || error.message);

        // Show simple error modal
        setErrorMessage('Unable to save Program IDs. The service may be temporarily unavailable. Please try again later.');
        setShowErrorModal(true);
      }
    };


    useEffect(() => {
      axios.get('/admin/filter-categories')
        .then((response) => {
          const categories = response.data.map((category) => ({
            value: category.filterCategoryCode,
            label: category.filterCategoryDescription,
          }));
          setFilterCategories(categories);
        })
        .catch((error) => {
          console.error('Error fetching filter categories:', error);
        });
    }, []);

  useEffect(() => {
    if (campaignId) {
      const program = programs.find((p) => p.value === campaignId);
      if (program) {
        setSelectedProgram(program.value);
      }
    }
  }, [campaignId, programs]);

    useEffect(() => {
      axios.get('/admin/filter-category-items')
        .then((response) => {
          setFilterCategoryItems(response.data);
        })
        .catch((error) => {
          console.error('Error fetching filter category items:', error);
        });
    }, []);


  const handleCategoryChange = (selectedValue) => {
    setSelectedCategory(selectedValue);

    // Update the newFilter state with the selected category
    setNewFilter((prevFilter) => ({
      ...prevFilter,
      category: selectedValue,
    }));

    if (selectedValue === 'PRD') {
      const productTypeOptions = filterCategoryItems
          .filter((item) => item.filterCategoryCode === 'PRD')
          .map((item) => ({
            value: item.code,
            label: item.description,
          }));
      setValueOptions(productTypeOptions);
    } else if (selectedValue.includes('BoB')) {
      const bookOfBusinessOptions = filterCategoryItems
          .filter((item) => item.filterCategoryCode === 'BoB')
          .map((item) => ({
            value: item.code,
            label: item.description,
          }));
      setValueOptions(bookOfBusinessOptions);
    } else {
      setValueOptions([]);
    }
  };

  useEffect(() => {
  }, [valueOptions]);

  // Refresh valueOptions when filterCategoryItems changes and BoB is selected
  useEffect(() => {
    console.log('=== valueOptions useEffect triggered ===');
    console.log('selectedCategory:', selectedCategory);
    console.log('filterCategoryItems count:', filterCategoryItems.length);

    if (selectedCategory && selectedCategory.includes('BoB')) {
      const bookOfBusinessOptions = filterCategoryItems
        .filter((item) => item.filterCategoryCode === 'BoB')
        .map((item) => ({
          value: item.code,
          label: item.description,
        }));
      console.log('Setting BoB options from useEffect:', bookOfBusinessOptions);
      setValueOptions(bookOfBusinessOptions);
    } else if (selectedCategory === 'PRD') {
      const productTypeOptions = filterCategoryItems
        .filter((item) => item.filterCategoryCode === 'PRD')
        .map((item) => ({
          value: item.code,
          label: item.description,
        }));
      console.log('Setting PRD options from useEffect:', productTypeOptions);
      setValueOptions(productTypeOptions);
    }
  }, [filterCategoryItems, selectedCategory]);

  // Load BoB items when modal opens
  useEffect(() => {
    if (showBoBModal && filterCategoryItems.length > 0) {
      const bobData = filterCategoryItems
        .filter((item) => item.filterCategoryCode === 'BoB')
        .map((item) => ({
          id: item.id,  // Use actual database ID
          code: item.code,
          description: item.description,
        }));
      setBobItems(bobData);
    }
  }, [showBoBModal, filterCategoryItems]);

  // Clear dropdown selection when BoB modal closes
  const prevShowBoBModal = useRef<boolean | null>(null);
  useEffect(() => {
    // Skip the first render (when ref is null)
    if (prevShowBoBModal.current === null) {
      prevShowBoBModal.current = showBoBModal;
      return;
    }

    // Only clear when transitioning from open (true) to closed (false)
    if (prevShowBoBModal.current === true && showBoBModal === false) {
      console.log('Modal closed, clearing dropdown selection');
      // Clear the value
      setNewFilter(prev => {
        console.log('Clearing dropdown value from:', prev.value, 'to empty string');
        return {...prev, value: ''};
      });
      // Use the ref's clearInput method to clear the component's internal state
      if (bobDropdownRef.current && bobDropdownRef.current.clearInput) {
        console.log('Calling clearInput() on dropdown ref');
        bobDropdownRef.current.clearInput();
      }
      // Also force dropdown to re-mount with new key
      setDropdownResetKey(prev => prev + 1);
    }

    // Update ref for next render
    prevShowBoBModal.current = showBoBModal;
  }, [showBoBModal]);

  // Clear Program dropdown selection when Program modal closes
  const prevShowProgramModal = useRef<boolean | null>(null);
  useEffect(() => {
    // Skip the first render (when ref is null)
    if (prevShowProgramModal.current === null) {
      prevShowProgramModal.current = showProgramModal;
      return;
    }

    // Only clear when transitioning from open (true) to closed (false)
    if (prevShowProgramModal.current === true && showProgramModal === false) {
      console.log('Program modal closed, forcing dropdown to re-mount');
      // Force dropdown to re-mount with new key to clear selection
      setProgramDropdownResetKey(prev => prev + 1);
    }

    // Update ref for next render
    prevShowProgramModal.current = showProgramModal;
  }, [showProgramModal]);

  // Fetch program details when Program modal opens
  useEffect(() => {
    if (showProgramModal) {
      axios.get('/admin/program-details')
        .then(response => {
          console.log('Fetched program details:', response.data);
          setProgramItems(response.data);
          // Store original items to track edits later
          setOriginalProgramItems(JSON.parse(JSON.stringify(response.data)));
        })
        .catch(error => {
          console.error('Error fetching program details:', error);
        });
    }
  }, [showProgramModal]);

  // Update BoB state whenever filters change
  useEffect(() => {
    const bobFilter = filters.find(filter =>
      !filter.delete &&
      filter.category === 'BoB' &&
      filter.rule === 'INCL' &&
      (filter.value === 'OX' || filter.value === 'OL'));
    const bobValue = bobFilter?.value || '';
    console.log('### Updating BoB from filters:', bobFilter, 'BoB value:', bobValue);
    setBoB(bobValue);
  }, [filters]);

  const ruleOptions = [
    { value: 'INCL', label: 'Inclusion' },
    { value: 'EXCL', label: 'Exclusion' },
  ];

  const customSelectInputStyle = {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '5px',
    fontSize: '14px',
  };

const emailTemplate = React.useMemo(() => {
    // Create a synthetic selectedOptions array with a single option
    const selectedOption = {
      value: '',
      label: title || '',
      campaignId: 0,
      title: title ?? '',
      description: description ?? '',
      urlLabel: urlLabel ?? '',
      urlLink: urlLinkEmail ?? '',
      selectedProgram: typeof selectedProgram === 'string' ? parseInt(selectedProgram, 10) || 0 : selectedProgram || 0,
      notificationTemplateResponseList: [{
        templateType: {
          templateTypeValue: 'EMAIL'
        },
        standardTemplate: {
          standardTemplateId: typeof template === 'string' ? parseInt(template, 10) : template,
          defaultDisclaimer: defaultDisclaimer ?? ''
        }
      }],
      subjectLine: subjectLine ?? '',
      senderEmail: senderEmail ?? '',
      disclaimer: campaignDisclaimer ?? '',
    };

    // Debug log to verify values
    console.log('Rendering EmailTemplate with:', {
      title,
      description,
      urlLabel,
      urlLinkEmail,
      clientContextId: String(clientContextMap[clientLaunchContextValue]),
      selectedProgram,
      template,
      selectedTemplateType,
      showPreview,
      subjectLine,
      senderEmail,
      campaignDisclaimer,
      defaultDisclaimer,
    });

  // Render EmailTemplateSurest component if template/messageTemplateId is 12 (number or string)
  if (template === 12 || template === '12') {
    return (
      <EmailTemplateSurest
        selectedOptions={[selectedOption]}
        clientContextId={String(clientContextMap[clientLaunchContextValue] || '')}
        BoB={BoB}
        source="EzcommAdminUI"
      />
    );
  }

    return (
      <EmailTemplateDefault
        selectedOptions={[selectedOption]}
        clientContextId={String(clientContextMap[clientLaunchContextValue] || '')}
        BoB={BoB}
        source="EzcommAdminUI"
      />
    );

}, [
 clientLaunchContextValue,
 title,
 description,
 urlLinkEmail,
 urlLabel,
 selectedProgram,
 clientContextMap,
 template, // add template as dependency
 BoB // add BoB as dependency
]);

  // Prepare SMS template component with selected options
  const smsTemplate = React.useMemo(() => {
    // Create a synthetic selectedOptions array with a single option for SMS preview
    const selectedOption = {
      value: '',
      label: newCampaignName || '',
      campaignId: 0,
      title: title ?? '',
      description: description ?? '',
      urlLabel: urlLabel ?? '',
      urlLink: urlLinkSMS ?? '',
      selectedProgram: typeof selectedProgram === 'string' ? parseInt(selectedProgram, 10) || 0 : selectedProgram || 0,
      notificationTemplateResponseList: [{
        name: 'SMS Template',
        templateParams: '{}',
        templateType: {
          templateTypeValue: 'SMS'
        },
        standardTemplate: {
          standardTemplateId: typeof template === 'string' ? parseInt(template, 10) : template,
        }
      }],
    };

    console.debug('### EzcommAdminUI - Rendering SMS Template with:', {
      title,
      urlLinkSMS,
      clientContextId: String(clientContextMap[clientLaunchContextValue]),
      template,
      selectedTemplateType,
    });

    return (
      <SMSTemplate
        selectedOptions={[selectedOption]}
        clientContextId={String(clientContextMap[clientLaunchContextValue] || '')}
        BoB={BoB}
        source="EzcommAdminUI"
        hsidreglink={urlLinkSMS}
      />
    );
  }, [
    clientLaunchContextValue,
    newCampaignName,
    urlLinkSMS,
    urlLabel,
    selectedProgram,
    clientContextMap,
    template,
    BoB,
    selectedTemplateType
  ]);

     useEffect(() => {
           axios.get('/admin/client-contexts')
             .then(response => {
               const options = response.data
                 .filter(context => context.title !== 'Sierra Member Services' && context.title !== 'Interaction Summary' && context.title !== 'UHC HUB Campaigns')
                 .map(context => ({
                   value: context.title,
                   label: context.title
                 }));
               setClientContextOptions(options);

               // Create a mapping of title to clientContextId
               const contextMap = response.data.reduce((map, context) => {
                 map[context.title] = context.clientContextId;
                 return map;
               }, {});
               setClientContextMap(contextMap);
             })
             .catch(error => {
               console.error('Error fetching client contexts:', error);
             });
         }, []);

       useEffect(() => {
         if (clientLaunchContextValue) {
           const clientContextId = clientContextMap[clientLaunchContextValue];
           if (clientContextId) {
             axios.get(`/admin/campaigns?clientContextId=${clientContextId}`)
               .then(response => {
                 console.log("RESPONSE DATA OBJECT ", response.data);
                 setCampaigns(response.data);
               })
               .catch(error => {
                 console.error('Error fetching campaigns:', error);
               });
           }
         }
       }, [clientLaunchContextValue, clientContextMap]);
     useEffect(() => {
       if (menuEntityId) {
         fetchCampaignDetails(menuEntityId);
       }
     }, [menuEntityId]);

     useEffect(() => {
       console.log('Disclaimer state changed:', campaignDisclaimer);
     }, [campaignDisclaimer]);

  return (
      <div style={{
        backgroundColor: '#FFFFFF', padding: '60px', borderRadius: '2px', border: '1px #ccc',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
          <Label style={{marginRight: '108px', fontWeight: '500'}}>Client Launch Context </Label>
          <SelectInput
              value={clientLaunchContextValue}
              onChange={(value) => setClientLaunchContextValue(value)}
              onClear={() => setClientLaunchContextValue('')}
              retainSectionHeader
              options={clientContextOptions}
              placeholder="- Select One -"
              hideChips
              width={550}
              maxListHeight="500vh"
              isDisabled={isDropdownDisabled}
          />
        </div>
        <div style={{display: 'flex', alignItems: 'center', marginBottom: '40px'}}>
          <Label style={{marginRight: '145px', fontWeight: '500'}}>Name (Admin UI) </Label>

          <React.Fragment>
            {isCreateMode && isDropdownDisabled ? (
              <TextInput
                value={campaignName}
                width={550}
                isDisabled={true}
                style={{ backgroundColor: '#f5f5f5' }}
              />
            ) : (
              <SelectInput
                  placeholder="Enter a new campaign name"
                  value={campaignName}
                  onChange={(value) =>  {
                    const specialCharRegex = /[^a-zA-Z0-9\s.,\-/]/;
                    const onlySpacesRegex = /^\s*$/;
                    const twoDotsRegex = /\.\./;
                    if (specialCharRegex.test(value) || onlySpacesRegex.test(value) || twoDotsRegex.test(value)) {
                                setCreateDisabled(true);
                                }
                    else {
                       setCampaignName(value || '');
                       const isExistingCampaign = campaigns.some((campaign) => campaign.name === value);
                       setButtonDisabled(false);
                       setShowLine(false);
                       if (isExistingCampaign) {
                         setEditDisabled(false);
                         setCreateDisabled(true);
                       } else {
                         setEditDisabled(true);
                         setCreateDisabled(false);
                       }
                    }
                  }}
                  onInputChange={(inputValue) => {
                    const specialCharRegex = /[^a-zA-Z0-9\s.,\-/]/;
                    const onlySpacesRegex = /^\s*$/;
                    const twoDotsRegex = /\.\./;
                              if (specialCharRegex.test(inputValue) || onlySpacesRegex.test(inputValue) || twoDotsRegex.test(inputValue)) {
                                setCreateDisabled(true);
                              } else {

                    setCampaignName(inputValue);
                    const isExistingCampaign = campaigns.some((campaign) => campaign.name === inputValue);
                    setButtonDisabled(false);
                    setShowLine(false);
                    if (isExistingCampaign) {
                      setEditDisabled(false);
                      setCreateDisabled(true);
                    } else {
                      setEditDisabled(true);
                      setCreateDisabled(false);
                    }
                  }
                  }}

                onClear={() => {
                  if (!isDropdownDisabled) {
                    setCampaignName('');
                    setEditDisabled(true);
                    setCreateDisabled(true);
                  }
                }}
                isClearable={!isDropdownDisabled}
                isSearchable
                width={550}
                maxListHeight="50vh"
               options={campaigns.map((campaign) => ({
               value: campaign.name,
               label: campaign.name,
              }))}
              isDisabled={isDropdownDisabled || !clientLaunchContextValue}
              />
            )}
          </React.Fragment>
        </div>



        <div style={{position: 'relative'}}>
          <div style={{position: 'absolute', right: showNewFields ? '99px' : '10px', display: 'flex', gap: '10px'}}>
            <button
                id="editButton"
                type="button"
                className={`btn btn-primary contactInfo ${!campaignName ? 'onlyNotificationAlign' : ''}`}
                disabled={editDisabled || buttonDisabled}
                onClick={() => {
                  handleEditClick();
                  setShowLine(true);
                  setIsRemoveEnabled(true);
                }}
            >
              Edit
            </button>
            <button
                id="createButton"
                type="button"
                className={`btn btn-success ${!campaignName ? 'onlyNotificationAlign' : ''}`}
                disabled={createDisabled || buttonDisabled || !clientLaunchContextValue || !campaignName}
                onClick={() => {
                  handleCreateClick();
                  setShowLine(true);
                }}
            >
              Create
            </button>
          </div>
        </div>



        {showNewFields && (
            <div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '100px'}}>
                <hr style={{width: '100%',}}/>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px'}}>
                  <Label style={{marginRight: '140px', fontWeight: '500'}}> Campaign Name (EZComm list) </Label>
                  <TextInput
                      placeholder="Enter a new campaign name"
                      value={newCampaignName}
                       onChange={(e) => setNewCampaignName(e.target.value)}
                      hideChips
                      width={550}
                      isDisabled={!newCampaignNameEnabled}
                  />
                </div>
                {newCampaignName === '' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>New campaign name is required</span>}
              </div>
               <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '310px', fontWeight: '500'}}>Template </Label>
                  <div style={{display: 'flex', gap: '20px'}}>
                    <FormProvider state={form}>
                      <RadioGroup
                      value={selectedTemplateType}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setSelectedTemplateType(value);
                                    }}
                                  display="row"
//                                   model="row"
                                  options={[
                                      { value: 'Email', label: 'Email' },
                                      { value: 'SMS', label: 'SMS' },
                                      { value: 'Both', label: 'Both' },
                                    ]}
                      >
                        <RadioGroup.Radio label="Email" value="Email" style={{transform: 'scale(0.4)'}}/>
                        <RadioGroup.Radio label="SMS" value="SMS"/>
                        <RadioGroup.Radio label="Both" value="Both"/>
                      </RadioGroup>
                    </FormProvider>
                  </div>
                </div>
                {selectedTemplateType === '' &&
                    <span style={{color: 'red', display: 'block', marginTop: '20px', marginLeft: '383px'}}>Template is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '275px', fontWeight: '500'}}> Email Template </Label>
                  <SelectInput
                      placeholder="Select One"
                      value={selectedMessageTemplate}
                      onChange={(value) => {
                        handleMessageTemplateChange(value);
                      }}
                      //onClear={() => setProgram('')}
                      /* onClear={() => setValue('')} */
                      retainSectionHeader
                      options={messageTemplates}
                      hideChips
                      width={300}
                      maxListHeight="500vh"
                      isDisabled={selectedTemplateType === 'SMS'}
                  />
                </div>
                {selectedMessageTemplate === '' && selectedTemplateType !== 'SMS' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Email Template is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '275px', fontWeight: '500'}}> SMS Template </Label>
                  <SelectInput
                      placeholder="Select One"
                      value={selectedMessageTemplate}
                      onChange={(value) => {
                        handleMessageTemplateChange(value);
                      }}
                      //onClear={() => setProgram('')}
                      /* onClear={() => setValue('')} */
                      retainSectionHeader
                      options={messageTemplates}
                      hideChips
                      width={300}
                      maxListHeight="500vh"
                      isDisabled={selectedTemplateType === 'Email'}
                  />
                </div>
                {selectedMessageTemplate === '' && selectedTemplateType !== 'Email' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>SMS Template is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '310px', fontWeight: '500'}}> New
                    Title </Label>
                  <TextInput
                      value={title}
                      onChange={({ target: { value } }) => {
                      setTitle(value)
                        }}
                      hideChips
                      width={300}
                  />
                </div>
                {title === '' && (clientContextMap[clientLaunchContextValue] === 1 || clientContextMap[clientLaunchContextValue] === 11) &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Title is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '260px', fontWeight: '500'}}>New Description </Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        isDisabled={selectedTemplateType === 'SMS'}
                    />
                  </FormProvider>
                </div>
                {description === '' && selectedTemplateType !== 'SMS' && (clientContextMap[clientLaunchContextValue] === 1 || clientContextMap[clientLaunchContextValue] === 11) &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Description is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '254px', fontWeight: '500'}}>New Subject Line </Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={subjectLine}
                        onChange={(e) => setSubjectLine(e.target.value)}
                        isDisabled={selectedTemplateType === 'SMS'}
                    />
                  </FormProvider>
                </div>
                {subjectLine === '' && selectedTemplateType !== 'SMS' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Subject Line is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '188px', fontWeight: '500'}}>New Campaign Disclaimer </Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={campaignDisclaimer}
                        onChange={(e) => setCampaignDisclaimer(e.target.value)}
                        isDisabled={selectedTemplateType === 'SMS'}
                    />
                  </FormProvider>
                </div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '220px', fontWeight: '500'}}>New URL Link (Email)</Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={urlLinkEmail}
                        onChange={(e) => setUrlLinkEmail(e.target.value)}
                        isDisabled={selectedTemplateType === 'SMS'}
                    />
                  </FormProvider>
                </div>
                {urlLinkEmail === '' && selectedTemplateType !== 'SMS' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Enter a valid url</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '228px', fontWeight: '500'}}>New URL Link (SMS)</Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={urlLinkSMS}
                        onChange={(e) => setUrlLinkSMS(e.target.value)}
                        isDisabled={selectedTemplateType === 'Email'}
                    />
                  </FormProvider>
                </div>
                {urlLinkSMS === '' && selectedTemplateType !== 'Email' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Enter a valid url</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '267px', fontWeight: '500'}}> New
                    URL Label </Label>
                  <TextInput
                      value={urlLabel}
                      onChange={(e) => {
                      setUrlLabel(e.target.value)
                       }}
                      hideChips
                      width={300}
                      isDisabled={selectedTemplateType === 'SMS'}
                  />
                </div>
                {urlLabel === '' && selectedTemplateType !== 'SMS' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>New URL label is required</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '255px', fontWeight: '500'}}> Program (EPMP) </Label>
                  <SelectInput
                      key={`program-dropdown-${programDropdownResetKey}`}
                      placeholder="Select One"
                      value={selectedProgram} // Ensure this is bound to the correct state
                      onChange={(value) => {
                        handleProgramChange(value); // Use handleProgramChange to update both program and sender email
                      }}
                      //onClear={() => setProgram('')}
                      /* onClear={() => setValue('')} */
                      retainSectionHeader
                      options={programs}
                      hideChips
                      width={300}
                      maxListHeight={500} // Use a pixel value for scrollable dropdown
                  />
                </div>
                {selectedProgram === '' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Program is required</span>}
              </div>
              {/* <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center',}}>
                  <Label style={{marginRight: '245px', fontWeight: '500'}}>New Sender Email </Label>
                  <FormProvider style={{width: '300px'}} state={form}>
                    <TextInputArea
                        rows={5}
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        isDisabled={selectedTemplateType === 'SMS'}
                    />
                  </FormProvider>
                </div>
                {senderEmail === '' && selectedTemplateType !== 'SMS' &&
                    <span style={{color: 'red', marginLeft: '380px', display: 'block', marginTop: '10px'}}>Sender Email is required</span>}
              </div> */}
              <div style={{alignItems: 'center', marginTop: '50px'}}>
                <div style={{
                  flexDirection: 'column',
                  marginTop: '50px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    display:'flex',
                  }} onClick={() => setIsExpanded(!isExpanded)}>
                    <h3 style={{margin: 0, minHeight: isExpanded ? 'auto' : '50px'}}>Campaign Filter</h3>
                    <IconMaterial icon={isExpanded ? 'expand_less' : 'expand_more'}/>
                  </div>
                  {isExpanded && (
                      <div style={{marginTop: '15px'}}>
                        <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                          <div style={{marginTop: '10px'}}>
                            <SelectInput
                                placeholder="Select Category"
                                options={filterCategories?.map((category) => ({
                                  value: category?.value || '', // Ensure a fallback value
                                  label: category?.label || 'Unknown', // Ensure a fallback label
                                }))}
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                width={200}
                                marginTop={10}
                            />

                          </div>
                          <div style={{marginTop: '10px'}}>
                            <SelectInput
                                placeholder="Select Rule"
                                value={newFilter.rule}
                                onChange={(value) => setNewFilter({...newFilter, rule: value})}
                                options={ruleOptions?.map((rule) => ({
                                  value: rule?.value || '', // Ensure a fallback value
                                  label: rule?.label || 'Unknown', // Ensure a fallback label
                                }))}
                                width={200}
                                style={customSelectInputStyle}
                            />
                          </div>

                          {selectedCategory ==='PRD' ? (
                              <div style={{marginTop: '10px'}}>
                              {console.log('selectedCategory value:', selectedCategory)}
                                <SelectInput
                                    placeholder="-- Select Value --"
//                                     options={productTypeOptions}
                                    value={newFilter.value}
                                    options={valueOptions?.map((valueNew) => ({
                                      value: valueNew?.value || '', // Ensure a fallback value
                                      label: valueNew?.label || 'Unknown', // Ensure a fallback label
                                    }))}
                                    onChange={(value) => setNewFilter({...newFilter, value: value})}
                                    isDisabled={!newFilter.rule && !selectedCategory}
                                />
                              </div>
                              ) : selectedCategory.includes('BoB') ? (
                                  <div style={{marginTop: '10px'}}>
                                    <SelectInput
                                        ref={bobDropdownRef}
                                        key={`bob-dropdown-${dropdownResetKey}`}
                                        placeholder="-- Category Item --"
                                        options={[
                                          { value: '+ Add New Bob', label: '+ Add New Bob' },
                                          ...(valueOptions || []).map((valueNew) => ({
                                            value: valueNew?.value || '',
                                            label: valueNew?.label || 'Unknown',
                                          }))
                                        ]}
                                        value={newFilter.value}
                                        onChange={(value) => {
                                          console.log('BoB dropdown selection:', value);
                                          if (value === '+ Add New Bob') {
                                            console.log('Opening BoB modal');
                                            setShowBoBModal(true);
                                            // Don't set value here - useEffect will clear it when modal closes
                                          } else {
                                            setNewFilter({...newFilter, value: value});
                                          }
                                        }}
                                        isDisabled={!newFilter.rule && !selectedCategory}
                                    />
                                  </div>
                          ) : (
                              <div style={{marginTop: '10px'}}>
                                <TextInput
                                    placeholder="Enter Value"
                                    value={newFilter.value}
                                    onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                                    isDisabled={!newFilter.rule && !selectedCategory}
                                />
                              </div>
                          )}
                          <Button
                              onClick={() => {
                                const conflictingRule = filters.find(
                                    (filter) =>
                                        filter.delete === false &&
                                        filter.category === newFilter.category &&
                                        filter.value === newFilter.value &&
                                        (filter.rule !== newFilter.rule || filter.rule === newFilter.rule)
                                );

                                if (conflictingRule) {
                                  console.error("Conflicting rule exists for the same category and value");
                                  alert("Conflicting rule exists for the same category and value");
                                }

                                 else {
                                  handleAdd();
                                }
                              }}
                              disabled={
                                  !newFilter.category || !newFilter.rule || !newFilter.value
                              }
                              style={{ marginTop: "10px" }}
                          >
                            Add
                          </Button>
                        </div>
                        {filters.length > 0 && (
                            <Table.Container title="Campaign Filters">
                              <Table.TableHeader>
                                <Table.TableHeaderRow>
                                  <Table.Column>Category</Table.Column>
                                  <Table.Column>Rule</Table.Column>
                                  <Table.Column>Value</Table.Column>
                                  <Table.Column></Table.Column>
                                </Table.TableHeaderRow>
                              </Table.TableHeader>
                              <Table.TableBody>
                                {filters.filter((filter) => !filter.delete).map((filter) => (
                                    <Table.Row key={filter.filterEntryId}>
                                      <Table.Cell>
                                        {filterCategories.find((category) => category.value === filter.category)?.label || filter.category}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {ruleOptions.find((rule) => rule.value === filter.rule)?.label || filter.rule}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {filterCategoryItems.find((valueNew) => valueNew.code === filter.value)?.description || filter.value}
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDelete(filter.filterEntryId)}
                                        >
                                          <IconMaterial icon="restore_from_trash" />
                                        </Button>
                                      </Table.Cell>
                                    </Table.Row>
                                ))}
                              </Table.TableBody>
                            </Table.Container>
                        )}
                      </div>
                  )}
                </div>
              </div>
              <div style={{
                marginTop: '50px',
                padding: '20px',
                border: '1px solid #ccc',
                border: '1px #ccc',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{marginBottom: '25px'}}>Preview</h3>
                <IconMaterial icon="visibility" onClick={() => setShowPreview(!showPreview)}
                              style={{cursor: 'pointer', marginBottom: '20px'}}/>
                {showPreview && (
                    <>
                      {console.log('Preview section:', { template, selectedTemplateType, showPreview })}
                      {selectedTemplateType === 'Email' && emailTemplate}
                      {selectedTemplateType === 'SMS' && smsTemplate}
                      {selectedTemplateType === 'Both' && (
                          <>
                            {emailTemplate}
                            <hr style={{margin: '50px 0', border: '1px solid #ccc', width: '100%'}} />
                            {smsTemplate}
                          </>
                      )}
                    </>
                )}
              </div>
              <div style={{position: 'relative', marginTop: '20px'}}>
                <div style={{position: 'absolute', right: '120px', display: 'flex', gap: '10px',}}>
                  <button
                      id="newButton"
                      type="button"
                      className={`btn btn-secondary  ${!campaignName ? 'onlyNotificationAlign' : ''}`}
                      isabled={!campaignName || buttonDisabled}
                      onClick={() => {
                        setShowCancelModal(true);
                      }}
                      style={{backgroundColor: 'grey', borderColor: 'grey'}}
                  >
                    Cancel
                  </button>
                  <button
                      id="removeButton"
                      type="button"
                      className={`btn btn-primary  ${!campaignName ? 'onlyNotificationAlign' : ''}`}
                       disabled={!campaignName ||
                          buttonDisabled ||
                          !newCampaignName ||
                          !selectedTemplateType ||
                          !title ||
                          (!description && selectedTemplateType !== 'SMS')||
                          (!urlLinkEmail && !urlLinkSMS) ||
//                           !urlLabel ||
                          (!urlLabel && selectedTemplateType !== 'SMS') ||
                          !selectedProgram ||
                          !isRemoveEnabled
//                           !menuEntityId
                      }
//                     disabled={!menuEntityId || buttonDisabled}
                      onClick={() => {
                        setShowRemoveModal(true);
                      }}
                  >
                    Remove
                  </button>
                  <button
                      id="saveButton"
                      type="button"
                      className="btn btn-success"
                      disabled={
                          !newCampaignName ||
                          !selectedTemplateType ||
                          (!urlLinkSMS && selectedTemplateType !== 'Email') ||
                          (!urlLinkEmail && selectedTemplateType !== 'SMS') ||
                          (!urlLabel && selectedTemplateType !== 'SMS') ||
                          !selectedProgram ||
                          ((clientContextMap[clientLaunchContextValue] === 1 || clientContextMap[clientLaunchContextValue] === 11)  && (!title || (!description && selectedTemplateType !== 'SMS'))) ||
                          !subjectLine ||
                          !senderEmail
                      }
                      onClick={handleSaveClick}
//                       onClick={handleSave}

                  >
                    Save
                  </button>
                  {isOpen && (
                      <Modal
                          isOpen={isOpen}
                          css={{
                            'abyss-modal-content-container': {
                              width: '479px',
                              height: '295px',
                              marginBottom: '163px',
                              marginRight: '109px',
                            },
                          }}
                      >
                        <div style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                        }}>
                          <h3 style={{
                            marginBottom: '10px',
                            fontSize: '18px',
                            color: '#333',
                          }}>
                            Confirmation Message
                          </h3>
                          <hr style={{margin: '10px 0'}}/>
                          <p style={{
                            marginBottom: '20px',
                            fontSize: '16px',
                            color: '#333',
                          }}>
                            You are about to {displayedText} : {newCampaignName}. Do you want to continue?
                          </p>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                          }}>
                            <hr style={{margin: '10px 0'}}/>
                            <button
                                style={{
                                  backgroundColor: '#007BFF',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}

                            onClick={async () => {
                              try {
                                const result = await handleSave(); // Save data to the database
                                if (result === true) {
                                  handleModalSave();
                                }
                              } catch (error) {
                                setShowExceptionModal(true); // Show exception modal
                              }
                            }}
                            >
                              Save
                            </button>
                            <button
                                style={{
                                  backgroundColor: '#d3d3d3',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={handleModalCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </Modal>

                  )}
                  {showInfoModal && (
                      <Modal
                          isOpen={showInfoModal}
                          css={{
                            'abyss-modal-content-container': {
                              width: '479px',
                              height: '200px',
                              marginBottom: '163px',
                              marginRight: '109px',
                            },
                          }}
                      >
                        <div style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                        }}>
                          <h3 style={{
                            marginBottom: '10px',
                            fontSize: '18px',
                            color: '#333',
                          }}>
                            Information Message
                          </h3>
                          <hr style={{margin: '10px 0'}}/>
                          <p style={{
                            marginBottom: '20px',
                            fontSize: '16px',
                            color: '#333',
                          }}>
                            {newCampaignName} is {displayedTextNew} successfully.
                          </p>
                          <hr style={{margin: '12px 0'}}/>
                          <button
                              style={{
                                backgroundColor: '#007BFF',
                                color: '#fff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setShowInfoModal(false)
                                setClientLaunchContextValue('');
                                setCampaignName('');
                                setNewCampaignName('');
                                setNewUrlLabel('');
                                setNewUrlLink('');
                                setShowNewFields(false);
                                setButtonDisabled(false);
                                setTemplate('');
                                setStandardTemplateId('');
                                setSelectedProgram('');
                                setTitle('');
                                setDescription('');
                                setShowPreview(false);
                                setIsExpanded(true);
                                setFilters([]);
                                setShowModal(false);
                                setShowLine(false);
                                setIsOpen(false);
                                setShowInfoModal(false);
                                setShowRemoveModal(false);
                                setIsDropdownDisabled(false);
                                setIsCreateMode(false);
                                window.location.reload(); // Refresh the page
                              }}
                          >
                            OK
                          </button>
                        </div>
                      </Modal>
                  )}
                {showExceptionModal && (
                    <Modal
                        isOpen={showExceptionModal}
                        css={{
                          'abyss-modal-content-container': {
                            width: '479px',
                            height: '200px',
                            marginBottom: '163px',
                            marginRight: '109px',
                          },
                        }}
                    >
                      <div style={{
                        padding: '20px',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                      }}>
                        <h3 style={{
                          marginBottom: '10px',
                          fontSize: '18px',
                          color: '#333',
                        }}>
                          Error
                        </h3>
                        <hr style={{margin: '10px 0'}}/>
                        <p style={{
                          marginBottom: '20px',
                          fontSize: '16px',
                          color: '#333',
                        }}>
                          An error occurred while saving the data. Please try again.
                        </p>
                        <hr style={{margin: '12px 0'}}/>
                        <button
                            style={{
                              backgroundColor: '#d9534f',
                              color: '#fff',
                              padding: '10px 20px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => setShowExceptionModal(false)}
                        >
                          Close
                        </button>
                      </div>
                    </Modal>
                )}
                  {showRemoveModal && (
                      <Modal
                          isOpen={showRemoveModal}
                          css={{
                            'abyss-modal-content-container': {
                              width: '479px',
                              height: '200px',
                              marginBottom: '163px',
                              marginRight: '109px',
                            },
                          }}
                      >
                        <div style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                        }}>
                          <h3 style={{
                            marginBottom: '10px',
                            fontSize: '18px',
                            color: '#333',
                          }}>
                            Remove Confirmation
                          </h3>
                          <hr style={{margin: '10px 0'}}/>
                          <p style={{
                            marginBottom: '20px',
                            fontSize: '16px',
                            color: '#333',
                          }}>
                            You are about to remove {newCampaignName}?. Do you want to continue?
                          </p>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                          }}>
                            <button
                                style={{
                                  backgroundColor: '#007BFF',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  console.log('Removing campaign:', newCampaignName);
                                  handleRemove();
                                  setShowRemoveModal(false);
                                }}
                            >
                              Save
                            </button>
                            <button
                                style={{
                                  backgroundColor: '#d3d3d3',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setShowRemoveModal(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </Modal>
                  )}
                  {showInfoRemoveModal && (
                      <Modal
                          isOpen={showInfoRemoveModal}
                          css={{
                            'abyss-modal-content-container': {
                              width: '479px',
                              height: '200px',
                              marginBottom: '163px',
                              marginRight: '109px',
                            },
                          }}
                      >
                        <div style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                        }}>
                          <h3 style={{
                            marginBottom: '10px',
                            fontSize: '18px',
                            color: '#333',
                          }}>
                            Information Message
                          </h3>
                          <hr style={{margin: '10px 0'}}/>
                          <p style={{
                            marginBottom: '20px',
                            fontSize: '16px',
                            color: '#333',
                          }}>
                            {newCampaignName} is removed successfully
                          </p>
                          <hr style={{margin: '12px 0'}}/>
                          <button
                              style={{
                                backgroundColor: '#007BFF',
                                color: '#fff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setShowInfoRemoveModal(false)
                                setClientLaunchContextValue('');
                                setCampaignName('');
                                setNewCampaignName('');
                                setNewUrlLabel('');
                                setNewUrlLink('');
                                setShowNewFields(false);
                                setButtonDisabled(false);
                                setTemplate('');
                                setStandardTemplateId('');
                                setSelectedProgram('');
                                setTitle('');
                                setDescription('');
                                setShowPreview(false);
                                setIsExpanded(true);
                                setFilters([]);
                                setShowModal(false);
                                setShowLine(false);
                                setIsOpen(false);
                                setShowInfoModal(false);
                                setShowRemoveModal(false);
                                setIsDropdownDisabled(false);
                                setIsCreateMode(false);
                                window.location.reload(); // Refresh the page
                              }}
                          >
                            OK
                          </button>
                        </div>
                      </Modal>
                  )}
                  {showCancelModal && (
                      <Modal
                          isOpen={showCancelModal}
                          css={{
                            'abyss-modal-content-container': {
                              width: '479px',
                              height: '200px',
                              marginBottom: '163px',
                              marginRight: '109px',
                            },
                          }}
                      >
                        <div style={{
                          padding: '20px',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                        }}>
                          <h3 style={{
                            marginBottom: '10px',
                            fontSize: '18px',
                            color: '#333',
                          }}>
                            Cancel Confirmation
                          </h3>
                          <hr style={{margin: '10px 0'}}/>
                          <p style={{
                            marginBottom: '20px',
                            fontSize: '16px',
                            color: '#333',
                          }}>
                            Changes will be lost, do you want to proceed?
                          </p>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                          }}>
                            <button
                                style={{
                                  backgroundColor: '#007BFF',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  console.log('Removing campaign:', newCampaignName);
                                  setShowCancelModal(false);
                                  setClientLaunchContextValue('');
                                  setCampaignName('');
                                  setNewCampaignName('');
                                  setNewUrlLabel('');
                                   setNewUrlLink('');
                                  setShowNewFields(false);
                                  setButtonDisabled(false);
                                  setTemplate('');
                                  setStandardTemplateId('');
                                  setSelectedProgram('');
                                  setTitle('');
                                  setDescription('');
                                  setShowPreview(false);
                                  setIsExpanded(true);
                                  setFilters([]);
                                  setShowModal(false);
                                  setShowLine(false);
                                  setIsOpen(false);
                                  setShowInfoModal(false);
                                  setShowRemoveModal(false);
                                  setIsDropdownDisabled(false);
                                  setIsCreateMode(false);
                                  window.location.reload(); // Refresh the page
                                }}
                            >
                              OK
                            </button>
                            <button
                                style={{
                                  backgroundColor: '#d3d3d3',
                                  color: '#fff',
                                  padding: '10px 20px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setShowCancelModal(false)
                                }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </Modal>
                  )}
                {showRemoveExceptionModal && (
                    <Modal
                        isOpen={showRemoveExceptionModal}
                        css={{
                          'abyss-modal-content-container': {
                            width: '479px',
                            height: '200px',
                            marginBottom: '163px',
                            marginRight: '109px',
                          },
                        }}
                    >
                      <div style={{
                        padding: '20px',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                      }}>
                        <h3 style={{
                          marginBottom: '10px',
                          fontSize: '18px',
                          color: '#333',
                        }}>
                          Error
                        </h3>
                        <hr style={{margin: '10px 0'}}/>
                        <p style={{
                          marginBottom: '20px',
                          fontSize: '16px',
                          color: '#333',
                        }}>
                          An error occurred while removing the campaign. Please try again.
                        </p>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '10px',
                        }}>
                          <button
                              style={{
                                backgroundColor: '#d9534f',
                                color: '#fff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setShowRemoveExceptionModal(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </Modal>
                )}
                </div>
              </div>
            </div>
        )}

        {/* Manage Book of Business (BoB) Modal */}
        {showBoBModal && (
          <Modal
            isOpen={showBoBModal}
            css={{
              'abyss-modal-content-container': {
                width: '600px',
                maxHeight: '90vh',
                marginBottom: '163px',
                marginRight: '109px',
              },
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '90vh',
              maxHeight: '90vh',
              borderRadius: '8px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}>
              {/* Header - Fixed */}
              <div style={{
                padding: '30px 30px 20px 30px',
                borderBottom: '2px solid #002677',
                flexShrink: 0,
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#002677',
                }}>
                  Manage Book of Business
                </h2>
              </div>

              {/* Content Area - Flex grow to fill space */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '20px 30px 100px 30px',
                minHeight: 0,
              }}>
                {/* Column Headers */}
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  marginBottom: '10px',
                  paddingLeft: '2px'
                }}>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '600', fontSize: '14px' }}>
                      BoB Description
                    </Label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label style={{ fontWeight: '600', fontSize: '14px' }}>
                      BoB Code
                    </Label>
                  </div>
                  <div style={{ width: '48px' }}></div>
                </div>

                {/* SCROLLABLE BoB Items List ONLY */}
                <div style={{
                  marginBottom: '20px',
                }}>
                {bobItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        value={item.description}
                        onChange={(e) => {
                          setBobItems(bobItems.map(bob =>
                            bob.id === item.id
                              ? { ...bob, description: e.target.value }
                              : bob
                          ));
                        }}
                        width="100%"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        value={item.code}
                        width="100%"
                        isDisabled={true}
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          try {
                            console.log('Attempting to delete BoB:', item.code);
                            // Call backend to check if BoB is tied to a campaign
                            const response = await axios.delete(`/admin/filter-category-items/bob/${item.code}`);
                            console.log('Delete response:', response.data);

                            if (response.data.success) {
                              // Store deleted BoB description for modal
                              setDeletedBobDescription(item.description);

                              // Successfully deleted from database, remove from local state
                              setBobItems(bobItems.filter(bob => bob.id !== item.id));

                              // Refresh filter category items to update the dropdown
                              const refreshResponse = await axios.get('/admin/filter-category-items');
                              setFilterCategoryItems(refreshResponse.data);

                              // Update valueOptions for BoB dropdown
                              const updatedBobOptions = refreshResponse.data
                                .filter((i: any) => i.filterCategoryCode === 'BoB')
                                .map((i: any) => ({
                                  value: i.code,
                                  label: i.description,
                                }));
                              setValueOptions(updatedBobOptions);

                              console.log('BoB deleted successfully');

                              // Show delete success modal
                              setShowBoBDeleteSuccessModal(true);
                            }
                          } catch (error: any) {
                            console.error('Error deleting BoB item:', error);
                            if (error.response?.status === 409) {
                              // Conflict - BoB is tied to campaigns
                              console.log('BoB is tied to campaigns, showing error modal');
                              console.log('Linked campaigns:', error.response?.data?.linkedCampaigns);

                              // Store linked campaigns from response
                              if (error.response?.data?.linkedCampaigns) {
                                setLinkedCampaigns(error.response.data.linkedCampaigns);
                              }

                              setShowBoBDeleteErrorModal(true);
                            } else {
                              alert('Error deleting BoB item. Please try again.');
                            }
                          }
                        }}
                        style={{ padding: '8px' }}
                        css={{
                          '&, & *': {
                            color: '#dc3545 !important',
                          }
                        }}
                      >
                        <IconMaterial icon="delete" color="$error1" style={{ color: '#dc3545', fontSize: '20px' }} />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>

                {/* Add New BoB Entry Fields - OUTSIDE SCROLL - Multiple Dynamic Fields */}
                <div style={{
                  borderTop: '2px solid #002677',
                  paddingTop: '20px',
                  marginTop: '10px',
                }}>
                  {/* Simple header label */}
                  <Label style={{ fontWeight: '600', fontSize: '14px', marginBottom: '15px', display: 'block' }}>
                    Add New BoB
                  </Label>

                  {/* Dynamic new BoB fields - no maxHeight, let content area handle scroll */}
                  <div>
                    {/* Dynamic new BoB fields */}
                    {newBobFields.map((field, index) => (
                    <div key={field.tempId} style={{
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          placeholder="Enter new BoB Description"
                          value={field.description}
                          onChange={(e) => {
                            const updated = newBobFields.map(f =>
                              f.tempId === field.tempId
                                ? { ...f, description: e.target.value }
                                : f
                            );
                            setNewBobFields(updated);
                          }}
                          width="100%"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          placeholder="Enter new BoB Code"
                          value={field.code}
                          onChange={(e) => {
                            const updated = newBobFields.map(f =>
                              f.tempId === field.tempId
                                ? { ...f, code: e.target.value }
                                : f
                            );
                            setNewBobFields(updated);
                          }}
                          width="100%"
                        />
                      </div>
                      <div style={{ width: '48px' }}>
                        {newBobFields.length > 1 && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setNewBobFields(newBobFields.filter(f => f.tempId !== field.tempId));
                            }}
                            style={{ padding: '8px' }}
                          >
                            <IconMaterial icon="remove_circle" style={{ color: '#dc3545' }} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>

                  {/* Add Field Button as inline row - OUTSIDE scroll */}
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    marginTop: '12px',
                  }}>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const newId = Date.now().toString();
                        setNewBobFields([...newBobFields, { tempId: newId, description: '', code: '' }]);
                      }}
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#002677',
                        fontWeight: '500',
                        border: '1px dashed #002677',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa',
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <IconMaterial icon="add_circle" style={{ fontSize: '20px' }} />
                      <span>Add Another BoB</span>
                    </Button>
                  </div>
                </div>
              </div>

            {/* Sticky Footer with Buttons - Always Visible */}
            <div style={{
              position: 'sticky',
              bottom: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '20px 30px',
              borderTop: '1px solid #e0e0e6',
              backgroundColor: '#fff',
              borderRadius: '0 0 8px 8px',
              flexShrink: 0,
              zIndex: 10,
            }}>
              <button
                style={{
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={() => {
                  // Reset fields and close modal
                  setNewBobFields([{ tempId: '1', description: '', code: '' }]);
                  // Close modal (useEffect will clear dropdown value)
                  setShowBoBModal(false);
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  backgroundColor: '#002677',
                  color: '#fff',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={async () => {
                    // Build the list of items to save (existing + new filled fields)
                    let itemsToSave = [...bobItems];
                    let newBobsAdded = 0;
                    let bobsUpdated = 0;
                    let newBobDescriptions: string[] = [];
                    let updatedBobDescriptions: string[] = [];

                    // Track which existing items were modified
                    const originalBobItems = filterCategoryItems
                      .filter((item) => item.filterCategoryCode === 'BoB')
                      .reduce((acc, item) => {
                        acc[item.id] = item.description;
                        return acc;
                      }, {} as Record<number, string>);

                    // Check for updated descriptions in existing items
                    bobItems.forEach(item => {
                      if (item.id > 0 && originalBobItems[item.id] !== item.description) {
                        bobsUpdated++;
                        updatedBobDescriptions.push(item.description);
                      }
                    });

                    // Add all new BoB fields that have both description and code filled
                    newBobFields.forEach(field => {
                      if (field.description.trim() && field.code.trim()) {
                        itemsToSave.push({
                          id: 0, // New item, backend will assign ID
                          code: field.code.trim(),
                          description: field.description.trim(),
                        });
                        newBobsAdded++;
                        newBobDescriptions.push(field.description.trim());
                      }
                    });

                    console.log('Saving Book of Business items:', itemsToSave);
                    console.log('New BoB items being added:', newBobsAdded);
                    console.log('Existing BoB items updated:', bobsUpdated);

                    try {
                      // Save to backend
                      const payload = {
                        bobItems: itemsToSave.map(item => ({
                          id: item.id > 0 ? item.id : null,
                          code: item.code,
                          description: item.description,
                        })),
                      };
                      console.log('POST payload:', payload);

                      const saveResponse = await axios.post('/admin/filter-category-items/bob', payload);

                      console.log('Save response:', saveResponse.data);

                      // Check for warnings (e.g., duplicate codes)
                      if (saveResponse.data.hasWarnings && saveResponse.data.warnings?.length > 0) {
                        alert(`Warning:\n\n${saveResponse.data.warnings.join('\n')}`);
                      }

                      // Refresh filter category items to update the dropdown
                      const response = await axios.get('/admin/filter-category-items');
                      console.log('Refreshed filter category items:', response.data);

                      // Update filterCategoryItems first
                      setFilterCategoryItems(response.data);

                      // Explicitly refresh valueOptions for BoB dropdown
                      const updatedBobOptions = response.data
                        .filter((item: any) => item.filterCategoryCode === 'BoB')
                        .map((item: any) => ({
                          value: item.code,
                          label: item.description,
                        }));
                      console.log('Updated BoB options after save:', updatedBobOptions);
                      setValueOptions(updatedBobOptions);

                      // Reset fields
                      setNewBobFields([{ tempId: '1', description: '', code: '' }]);

                      // Reset the filter value so dropdown shows properly
                      setNewFilter({...newFilter, value: ''});

                      console.log('BoB items saved successfully - valueOptions updated');

                      // Close modal after successful save
                      setShowBoBModal(false);

                      // Show success notification if new BoB(s) were added or updated
                      if (newBobsAdded > 0 || bobsUpdated > 0) {
                        let successMessage = '';

                        if (newBobsAdded > 0 && bobsUpdated > 0) {
                          // Both added and updated
                          successMessage = `Added ${newBobsAdded} and updated ${bobsUpdated} BoB item(s)`;
                        } else if (newBobsAdded > 0) {
                          // Only added
                          successMessage = newBobsAdded === 1
                            ? newBobDescriptions[0]
                            : `${newBobsAdded} BoB items`;
                        } else if (bobsUpdated > 0) {
                          // Only updated
                          successMessage = bobsUpdated === 1
                            ? `Updated ${updatedBobDescriptions[0]}`
                            : `Updated ${bobsUpdated} BoB item(s)`;
                        }

                        setSavedBobDescription(successMessage);
                        setShowBoBSuccessModal(true);
                      }
                    } catch (error) {
                      console.error('Error saving BoB items:', error);
                      alert('Error saving BoB items. Please try again.');
                    }
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Success Notification Modal */}
        {showBoBSuccessModal && (
          <Modal
            isOpen={showBoBSuccessModal}
            onClose={() => setShowBoBSuccessModal(false)}
            width="450px"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '30px',
            }}>
              {/* Header */}
              <div style={{
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '15px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{
                    fontSize: '24px',
                  }}>✓</span>
                  Success
                </h2>
              </div>

              {/* Content */}
              <div style={{
                padding: '10px 0',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#495057',
                  lineHeight: '1.5',
                }}>
                  Added <strong style={{ color: '#28a745' }}>{savedBobDescription}</strong> successfully!
                </p>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #dee2e6',
              }}>
                <button
                  style={{
                    backgroundColor: '#28a745',
                    color: '#fff',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  onClick={() => setShowBoBSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Success Modal */}
        {showProgramDeleteSuccessModal && (
          <Modal
            isOpen={showProgramDeleteSuccessModal}
            onClose={() => {
              setShowProgramDeleteSuccessModal(false);
              setDeletedProgramDescription('');
              setSelectedProgram('');
              fetchPrograms();
            }}
            width="450px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
              <div style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                <h2 style={{
                  margin: 0, fontSize: '20px', fontWeight: 600, color: '#dc3545',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <IconMaterial icon="check_circle" style={{ fontSize: '24px', color: '#28a745' }} />
                  Deleted
                </h2>
              </div>

              <div style={{ padding: '10px 0' }}>
                <p style={{ margin: 0, fontSize: '16px', color: '#495057', lineHeight: 1.5 }}>
                  Deleted <strong style={{ color: '#dc3545' }}>{deletedProgramDescription}</strong> successfully!
                </p>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                paddingTop: '10px', borderTop: '1px solid #dee2e6'
              }}>
                <button
                  style={{
                    backgroundColor: '#dc3545', color: '#fff', padding: '10px 24px',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '500'
                  }}
                  onClick={() => {
                    setShowProgramDeleteSuccessModal(false);
                    setDeletedProgramDescription('');
                    setSelectedProgram('');
                    fetchPrograms();
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}

          {/* Manage Program IDs Modal */}
          {showProgramModal && (
  <Modal
    isOpen={showProgramModal}
    onClose={() => {
      console.log('Program modal X button clicked, closing and clearing dropdown');
      // Reset new fields and clear validation errors
      setNewProgramFields([{ tempId: '1', programId: '', programDescription: '', clientId: '', senderName: '', senderEmail: '' }]);
      setProgramIdErrors({});
      // Close modal
      setShowProgramModal(false);
    }}
    css={{
      'abyss-modal-content-container': {
        width: '1100px',
        maxHeight: '90vh',
        marginBottom: '163px',
        marginRight: '109px',
      },
    }}
  >
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '90vh',
      maxHeight: '90vh',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Header - Fixed */}
      <div style={{
        padding: '30px 30px 20px 30px',
        borderBottom: '2px solid #002677',
        flexShrink: 0,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: '#002677',
        }}>
          Manage Program IDs
        </h2>
      </div>

      {/* Content Area - Flex grow to fill space */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px 30px 100px 30px',
        minHeight: 0,
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '10px',
          paddingLeft: '2px'
        }}>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', fontSize: '14px' }}>
              Program ID Description
            </Label>
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', fontSize: '14px' }}>
              Program ID
            </Label>
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', fontSize: '14px' }}>
              OAuth Client ID
            </Label>
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', fontSize: '14px' }}>
              Sender Name
            </Label>
          </div>
          <div style={{ flex: 1 }}>
            <Label style={{ fontWeight: '600', fontSize: '14px' }}>
              Sender Email
            </Label>
          </div>
          <div style={{ width: '48px' }}></div>
        </div>

        {/* SCROLLABLE Program Items List ONLY */}
        <div style={{
          marginBottom: '20px',
        }}>
          {programItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
              Loading Program IDs...
            </p>
          ) : (
            programItems.map((item) => (
              <div key={item.smsManagerSettingId} style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '15px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={item.programDescription || ''}
                    onChange={(e) => {
                      setProgramItems(programItems.map(prog =>
                        prog.smsManagerSettingId === item.smsManagerSettingId
                          ? { ...prog, programDescription: e.target.value }
                          : prog
                      ));
                    }}
                    width="100%"
                    placeholder="Enter Program ID Description"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={item.programId}
                    width="100%"
                    isDisabled={true}
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={item.clientId || ''}
                    onChange={(e) => {
                      setProgramItems(programItems.map(prog =>
                        prog.smsManagerSettingId === item.smsManagerSettingId
                          ? { ...prog, clientId: e.target.value }
                          : prog
                      ));
                    }}
                    width="100%"
                    placeholder="Enter OAuth Client ID"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={item.senderName || ''}
                    onChange={(e) => {
                      setProgramItems(programItems.map(prog =>
                        prog.smsManagerSettingId === item.smsManagerSettingId
                          ? { ...prog, senderName: e.target.value }
                          : prog
                      ));
                    }}
                    width="100%"
                    placeholder="Enter Sender Name"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    value={item.senderEmail || ''}
                    onChange={(e) => {
                      setProgramItems(programItems.map(prog =>
                        prog.smsManagerSettingId === item.smsManagerSettingId
                          ? { ...prog, senderEmail: e.target.value }
                          : prog
                      ));
                    }}
                    width="100%"
                    placeholder="Enter Sender Email"
                  />
                </div>
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteProgramId(item)}
                    style={{ padding: '8px' }}
                    css={{
                      '&, & *': {
                        color: '#dc3545 !important',
                      }
                    }}
                  >
                    <IconMaterial icon="delete" color="$error1" style={{ color: '#dc3545', fontSize: '20px' }} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Program ID Entry Fields */}
        <div style={{
          borderTop: '2px solid #002677',
          paddingTop: '20px',
          marginTop: '10px',
        }}>
          <Label style={{ fontWeight: '600', fontSize: '14px', marginBottom: '15px', display: 'block' }}>
            Add New Program ID
          </Label>

          {/* Dynamic new Program ID fields */}
          <div>
            {newProgramFields.map((field, index) => (
              <div key={field.tempId} style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Enter Program ID Description"
                    value={field.programDescription || ''}
                    onChange={(e) => {
                      const updated = newProgramFields.map(f =>
                        f.tempId === field.tempId
                          ? { ...f, programDescription: e.target.value }
                          : f
                      );
                      setNewProgramFields(updated);
                    }}
                    width="100%"
                  />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <TextInput
                    placeholder="Enter Program ID"
                    value={field.programId}
                    onChange={(e) => {
                      const updated = newProgramFields.map(f =>
                        f.tempId === field.tempId
                          ? { ...f, programId: e.target.value }
                          : f
                      );
                      setNewProgramFields(updated);
                      // Clear error when user starts typing
                      if (e.target.value.trim() && programIdErrors[field.tempId]) {
                        setProgramIdErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[field.tempId];
                          return newErrors;
                        });
                      }
                    }}
                    width="100%"
                    style={programIdErrors[field.tempId] ? { borderColor: '#dc3545' } : {}}
                  />
                  {programIdErrors[field.tempId] && (
                    <div style={{ 
                      color: '#dc3545', 
                      fontSize: '12px', 
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {programIdErrors[field.tempId]}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Enter OAuth Client ID"
                    value={field.clientId || ''}
                    onChange={(e) => {
                      const updated = newProgramFields.map(f =>
                        f.tempId === field.tempId
                          ? { ...f, clientId: e.target.value }
                          : f
                      );
                      setNewProgramFields(updated);
                    }}
                    width="100%"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Enter Sender Name"
                    value={field.senderName || ''}
                    onChange={(e) => {
                      const updated = newProgramFields.map(f =>
                        f.tempId === field.tempId
                          ? { ...f, senderName: e.target.value }
                          : f
                      );
                      setNewProgramFields(updated);
                    }}
                    width="100%"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Enter Sender Email"
                    value={field.senderEmail || ''}
                    onChange={(e) => {
                      const updated = newProgramFields.map(f =>
                        f.tempId === field.tempId
                          ? { ...f, senderEmail: e.target.value }
                          : f
                      );
                      setNewProgramFields(updated);
                    }}
                    width="100%"
                  />
                </div>
                <div style={{ width: '48px' }}>
                  {newProgramFields.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setNewProgramFields(newProgramFields.filter(f => f.tempId !== field.tempId));
                      }}
                      style={{ padding: '8px' }}
                    >
                      <IconMaterial icon="remove_circle" style={{ color: '#dc3545' }} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            marginTop: '12px',
          }}>
            <Button
              variant="ghost"
              onClick={() => {
                const newId = Date.now().toString();
                setNewProgramFields([...newProgramFields, { tempId: newId, programId: '', programDescription: '', clientId: '', senderName: '', senderEmail: '' }]);
              }}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#002677',
                fontWeight: '500',
                border: '1px dashed #002677',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <IconMaterial icon="add_circle" style={{ fontSize: '20px' }} />
              <span>Add Another Program ID</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Footer with Buttons - Always Visible */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        padding: '20px 30px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#fff',
        borderRadius: '0 0 8px 8px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          style={{
            backgroundColor: '#6c757d',
            color: '#fff',
            padding: '10px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onClick={() => {
            setNewProgramFields([{ tempId: '1', programId: '', programDescription: '', clientId: '', senderName: '', senderEmail: '' }]);
            setProgramIdErrors({});
            setShowProgramModal(false);
          }}
        >
          Cancel
        </button>
        <button
          style={{
            backgroundColor: '#002677',
            color: '#fff',
            padding: '10px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onClick={handleSaveProgramIds}
        >
          Save Changes
        </button>
      </div>
    </div>
  </Modal>
)}

        {/* Program IDs Save Success Modal */}
        {showSuccessModal && (
          <Modal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              fetchPrograms(); // Refresh programs dropdown
            }}
            width="450px"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '30px',
            }}>
              {/* Header */}
              <div style={{
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '15px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <span style={{
                    fontSize: '24px',
                  }}>✓</span>
                  Success
                </h2>
              </div>

              {/* Content */}
              <div style={{
                padding: '10px 0',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: '#495057',
                  lineHeight: '1.5',
                }}>
                  {successMessage}
                </p>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #dee2e6',
              }}>
                <button
                  style={{
                    backgroundColor: '#28a745',
                    color: '#fff',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  onClick={() => {
                    setShowSuccessModal(false);
                    fetchPrograms(); // Refresh programs dropdown
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Error Modal */}
        {showBoBDeleteErrorModal && (
          <Modal
            isOpen={showBoBDeleteErrorModal}
            onClose={() => setShowBoBDeleteErrorModal(false)}
            width="600px"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '30px',
            }}>
              {/* Header */}
              <div style={{
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '15px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <IconMaterial icon="error" style={{ fontSize: '24px' }} />
                  Cannot Delete
                </h2>
              </div>

              {/* Content */}
              <div style={{
                padding: '10px 0',
              }}>
                <p style={{
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  color: '#495057',
                  lineHeight: '1.6',
                }}>
                  <strong style={{ color: '#dc3545' }}>Unlink the Book of Business (BoB) to all Campaigns before deleting</strong>
                </p>

                {/* List of linked campaigns from backend response */}
                {linkedCampaigns && linkedCampaigns.length > 0 && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                  }}>
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#495057',
                    }}>
                      Linked Campaigns:
                    </p>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      listStyleType: 'disc',
                    }}>
                      {linkedCampaigns.map((campaign, index) => (
                        <li key={index} style={{
                          fontSize: '14px',
                          color: '#495057',
                          marginBottom: '5px',
                        }}>
                          {campaign}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #dee2e6',
              }}>
                <button
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  onClick={() => {
                    setShowBoBDeleteErrorModal(false);
                    setLinkedCampaigns([]); // Clear linked campaigns when closing
                    setDeletedProgramDescription(''); // clear when closing
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Error Modal */}
        {showProgramDeleteErrorModal && (
          <Modal
            isOpen={showProgramDeleteErrorModal}
            onClose={() => setShowProgramDeleteErrorModal(false)}
            width="600px"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '30px',
            }}>
              {/* Header */}
              <div style={{
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '15px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <IconMaterial icon="error" style={{ fontSize: '24px' }} />
                  Cannot Delete
                </h2>
              </div>

              {/* Content */}
              <div style={{
                padding: '10px 0',
              }}>
                <p style={{
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  color: '#495057',
                  lineHeight: '1.6',
                }}>
                  <strong style={{ color: '#dc3545' }}>Unlink the Program ID to all Campaigns before deleting</strong>
                </p>

                {/* List of linked campaigns from backend response */}
                {linkedCampaigns && linkedCampaigns.length > 0 && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                  }}>
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#495057',
                    }}>
                      Linked Campaigns:
                    </p>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      listStyleType: 'disc',
                    }}>
                      {linkedCampaigns.map((campaign, index) => (
                        <li key={index} style={{
                          fontSize: '14px',
                          color: '#495057',
                          marginBottom: '5px',
                        }}>
                          {campaign}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #dee2e6',
              }}>
                <button
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  onClick={() => {
                    setShowProgramDeleteErrorModal(false);
                    setLinkedCampaigns([]); // Clear linked campaigns when closing
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
  );
};

