import json

import orthanc

MAX_INSTANCES = 500
MAX_SIZE_MB = 512

def OnStoredInstance(dicom, metadata):
    try:
        series_id = metadata['ParentSeries']
        series_info = orthanc.RestApiGet(f'/series/{series_id}')

        instances_count = int(series_info['InstancesCount'])
        if instances_count > MAX_INSTANCES:
            orthanc.LogWarning(f'[REJECTED] Series {series_id} has {instances_count} instances. Limit is {MAX_INSTANCES}')
            return orthanc.ReturnError(f"Rejected: Series exceeds {MAX_INSTANCES} images")

        size_mb = int(series_info['DiskSize']) / (1024 * 1024)
        if size_mb > MAX_SIZE_MB:
            orthanc.LogWarning(f'[REJECTED] Series {series_id} size is {size_mb:.2f}MB. Limit is {MAX_SIZE_MB}MB')
            return orthanc.ReturnError(f"Rejected: Series exceeds {MAX_SIZE_MB}MB")

    except Exception as e:
        orthanc.LogError(f'Validation plugin error: {e}')

orthanc.RegisterOnStoredInstanceCallback(OnStoredInstance)


def GeneratePdf(output, uri, **request):
    try:
        study_key = uri.split('/')[-1]
        study_id = study_key
        find_body = json.dumps({'Level': 'Study', 'Query': {'StudyInstanceUID': study_key}})
        find_result = orthanc.RestApiPost('/tools/find', find_body)
        if isinstance(find_result, bytes):
            find_result = find_result.decode('utf-8')
        find_ids = json.loads(find_result)
        if find_ids:
            study_id = find_ids[0]
        orthanc.RestApiGet(f'/studies/{study_id}')
        orthanc.LogInfo(f'PDF requested for study {study_id}')
        # مؤقتاً: هنرجع نص بسيط. بعدين هنركب FPDF
        pdf_content = f'PDF Report for Study: {study_id}'.encode('utf-8')
        output.AnswerBuffer(pdf_content, 'application/pdf')
    except Exception as e:
        orthanc.LogError(f'PDF generation error: {e}')
        output.SendHttpStatus(500, str(e))


orthanc.RegisterRestCallback('/reports/pdf/(.*)', GeneratePdf)
